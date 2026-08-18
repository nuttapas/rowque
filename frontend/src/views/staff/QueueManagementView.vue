<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoundStore } from '@/stores/round.store';
import { useQueueStore } from '@/stores/queue.store';
import { STATUS_LABELS, STATUS_COLORS, ERROR_MESSAGES } from '@/constants';
import type { QueueEntry, QueuePosition } from '@/types';

const roundStore = useRoundStore();
const queueStore = useQueueStore();

const selectedRoundId = ref<string | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const errorMsg = ref<string | null>(null);
const supportCount = ref<number>(0);
const generalCount = ref<number>(0);

const supportEntries = computed(() => queueStore.entries.filter(e => e.position === 'support'));
const generalEntries = computed(() => queueStore.entries.filter(e => e.position === 'general'));
const selectedEntries = computed(() => queueStore.selectedEntries);

onMounted(async () => {
  loading.value = true;
  try {
    await roundStore.loadRounds();
    // choose first active round if available
    const active = roundStore.activeRounds[0] || roundStore.acceptingRounds[0] || roundStore.rounds[0];
    if (active) {
      selectedRoundId.value = active.id;
        await roundStore.loadRoundWithStats(selectedRoundId.value);
        await queueStore.loadEntries(selectedRoundId.value);
        queueStore.subscribeToEntries(selectedRoundId.value);
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
});

async function openAccepting() {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await roundStore.reopenRound(selectedRoundId.value);
    await roundStore.loadRoundWithStats(selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'ไม่สามารถเปิดรับคิวได้';
  } finally {
    actionLoading.value = false;
  }
}

async function closeAccepting() {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await roundStore.closeRoundAccepting(selectedRoundId.value);
    await roundStore.loadRoundWithStats(selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'ไม่สามารถปิดรับคิวได้';
  } finally {
    actionLoading.value = false;
  }
}

async function createAndOpenRound() {
  const date = prompt('วันที่ของรอบ (YYYY-MM-DD)');
  if (!date) return;
  actionLoading.value = true;
  try {
    const newRound = await roundStore.createRound(date);
    // reopen (set accepting entries) the newly created round
    await roundStore.openRound(newRound.id);
    selectedRoundId.value = newRound.id;
    await roundStore.loadRounds();
    await roundStore.loadRoundWithStats(newRound.id);
    await queueStore.loadEntries(newRound.id);
  } catch (err: any) {
    errorMsg.value = err.message || 'ไม่สามารถเปิดรอบใหม่ได้';
  } finally {
    actionLoading.value = false;
  }
}

async function refresh() {
  if (!selectedRoundId.value) return;
  loading.value = true;
  try {
    await queueStore.loadEntries(selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
}

async function onRoundChange() {
  if (!selectedRoundId.value) return;
  loading.value = true;
  try {
    await roundStore.loadRoundWithStats(selectedRoundId.value);
    await queueStore.loadEntries(selectedRoundId.value);
    queueStore.subscribeToEntries(selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    loading.value = false;
  }
}

async function handleRandom(position: QueuePosition) {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    // Default to 1 when invoked per-position
    const result = await queueStore.randomSelect(selectedRoundId.value, position, 1);
    if (!result.success) {
      errorMsg.value = result.message || ERROR_MESSAGES[result.code || 'NETWORK_ERROR'];
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาดในการสุ่ม';
  } finally {
    actionLoading.value = false;
  }
}

async function handleRandomBoth() {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    queueStore.clearSelected();
    if (supportCount.value > 0) {
      await queueStore.randomSelect(selectedRoundId.value, 'support', supportCount.value);
    }
    if (generalCount.value > 0) {
      await queueStore.randomSelect(selectedRoundId.value, 'general', generalCount.value);
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาดในการสุ่ม';
  } finally {
    actionLoading.value = false;
  }
}

// confirm/reject workflow removed from frontend: random/manual becomes called immediately

async function handleCall(entryId: string) {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await queueStore.manualCall(entryId, selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาดในการเรียกคิว';
  } finally {
    actionLoading.value = false;
  }
}

async function handleComplete(entryId: string) {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await queueStore.complete(entryId, selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    actionLoading.value = false;
  }
}

async function handleNoShow(entryId: string) {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await queueStore.markNoShow(entryId, selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    actionLoading.value = false;
  }
}

async function handleCancel(entryId: string) {
  if (!selectedRoundId.value) return;
  actionLoading.value = true;
  try {
    await queueStore.cancel(entryId, selectedRoundId.value);
  } catch (err: any) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    actionLoading.value = false;
  }
}

function canCall(entry: QueueEntry) {
  return entry.status === 'waiting' || entry.status === 'selected' || entry.status === 'cancelled';
}

function canComplete(entry: QueueEntry) {
  return entry.status === 'called' || entry.status === 'serving';
}


function getStatusLabel(status: QueueEntry['status']) {
  return STATUS_LABELS[status];
}

function getStatusColor(status: QueueEntry['status']) {
  return STATUS_COLORS[status];
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">จัดการคิว</h1>
        <p class="text-gray-600">จัดการคิวของรอบปัจจุบัน</p>
      </div>
      <div class="flex items-center space-x-2">
        <select v-model="selectedRoundId" @change="onRoundChange" class="input-field">
          <option v-for="r in roundStore.rounds" :key="r.id" :value="r.id">
            {{ 'Round #' + r.round_number + ' - ' + new Date(r.event_date).toLocaleDateString('th-TH') }}
          </option>
        </select>
        <button @click="refresh" class="btn-secondary">รีเฟรช</button>
        <template v-if="roundStore.currentRound">
          <button v-if="roundStore.currentRound.accepting_entries" @click="closeAccepting" :disabled="actionLoading" class="btn-danger">🔒 ปิดรับคิว</button>
          <button v-else @click="openAccepting" :disabled="actionLoading" class="btn-primary">🔓 เปิดรับเพิ่ม</button>
          <button @click="createAndOpenRound" :disabled="actionLoading" class="btn-secondary">➕ เปิดรอบใหม่</button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <div v-if="errorMsg" class="text-red-600 mb-4">{{ errorMsg }}</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Random settings and selected cards -->
      <div class="card col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">การสุ่มคิว</h2>
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2">
              <label class="text-sm">Support</label>
              <button @click="supportCount = Math.max(0, supportCount - 1)" class="btn-small">-</button>
              <input type="number" v-model.number="supportCount" class="w-16 text-center input-field" min="0" />
              <button @click="supportCount = supportCount + 1" class="btn-small">+</button>
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm">General</label>
              <button @click="generalCount = Math.max(0, generalCount - 1)" class="btn-small">-</button>
              <input type="number" v-model.number="generalCount" class="w-16 text-center input-field" min="0" />
              <button @click="generalCount = generalCount + 1" class="btn-small">+</button>
            </div>
            <button @click="handleRandomBoth" :disabled="actionLoading" class="btn-primary">🎲 สุ่มคิว</button>
            <button @click="queueStore.clearSelected();" class="btn-secondary">ล้าง</button>
            <button @click="refresh" class="btn-secondary">รีเฟรช</button>
          </div>
        </div>

        <div class="mb-4">
          <h3 class="text-lg font-medium">กำลังเรียก (ผลการสุ่ม/เลือก)</h3>
          <div class="flex space-x-4 mt-3 overflow-x-auto">
            <div v-for="entry in selectedEntries" :key="entry.id" class="card p-4 w-72">
              <div class="text-xl font-bold text-center">{{ entry.queue_number }}</div>
              <div class="text-center mt-2">{{ entry.player_name }}</div>
              <div class="text-center mt-1 text-sm">{{ entry.position }}</div>
              <div class="flex justify-between mt-4">
                <button @click="handleComplete(entry.id)" class="btn-primary">✅ เสร็จสิ้น</button>
                <button @click="handleCancel(entry.id)" class="btn-danger">❌ ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Support</h2>
          <div class="flex space-x-2">
            <button @click="handleRandom('support')" :disabled="actionLoading" class="btn-primary">🎲 สุ่ม</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="entry in supportEntries" :key="entry.id">
                <td class="px-4 py-3 font-bold">{{ entry.queue_number }}</td>
                <td class="px-4 py-3">{{ entry.player_name }}</td>
                <td class="px-4 py-3">{{ entry.contact }}</td>
                <td class="px-4 py-3"><span class="badge" :class="getStatusColor(entry.status)">{{ getStatusLabel(entry.status) }}</span></td>
                <td class="px-4 py-3">
                  <div class="flex space-x-2">
                    <button v-if="canCall(entry)" @click="handleCall(entry.id)" class="text-blue-600">📢 เรียก</button>
                    <button v-if="canComplete(entry)" @click="handleComplete(entry.id)" class="text-green-600">✅ เสร็จ</button>
                    <button v-if="canComplete(entry)" @click="handleNoShow(entry.id)" class="text-red-600">⚠️ ไม่มา</button>
                    <button v-if="entry.status==='waiting' || entry.status==='selected'" @click="handleCancel(entry.id)" class="text-gray-600">❌ ยกเลิก</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="supportEntries.length===0" class="text-center py-6 text-gray-500">ไม่มีคิว</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">General</h2>
          <div class="flex space-x-2">
            <button @click="handleRandom('general')" :disabled="actionLoading" class="btn-primary">🎲 สุ่ม</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="entry in generalEntries" :key="entry.id">
                <td class="px-4 py-3 font-bold">{{ entry.queue_number }}</td>
                <td class="px-4 py-3">{{ entry.player_name }}</td>
                <td class="px-4 py-3">{{ entry.contact }}</td>
                <td class="px-4 py-3"><span class="badge" :class="getStatusColor(entry.status)">{{ getStatusLabel(entry.status) }}</span></td>
                <td class="px-4 py-3">
                  <div class="flex space-x-2">
                    <button v-if="canCall(entry)" @click="handleCall(entry.id)" class="text-blue-600">📢 เรียก</button>
                    <button v-if="canComplete(entry)" @click="handleComplete(entry.id)" class="text-green-600">✅ เสร็จ</button>
                    <button v-if="canComplete(entry)" @click="handleNoShow(entry.id)" class="text-red-600">⚠️ ไม่มา</button>
                    <button v-if="entry.status==='waiting' || entry.status==='selected'" @click="handleCancel(entry.id)" class="text-gray-600">❌ ยกเลิก</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="generalEntries.length===0" class="text-center py-6 text-gray-500">ไม่มีคิว</div>
        </div>
      </div>
    </div>
  </div>
</template>
