<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { useQueueStore } from '@/stores/queue.store';
import { POSITION_LABELS, STATUS_LABELS, STATUS_COLORS, ROUND_STATUS_LABELS, ROUND_STATUS_COLORS } from '@/constants';
import type { QueuePosition, QueueEntry } from '@/types';

const route = useRoute();
const roundStore = useRoundStore();
const queueStore = useQueueStore();

const roundId = route.params.id as string;
const selectedPosition = ref<QueuePosition | 'all'>('all');
const selectedStatus = ref<QueueEntry['status'] | 'all'>('all');
const searchQuery = ref('');
const loading = ref(false);
const reopenReason = ref('');
const showReopenModal = ref(false);

const filteredEntries = computed(() => {
  let entries = queueStore.entries;
  
  if (selectedPosition.value !== 'all') {
    entries = entries.filter(e => e.position === selectedPosition.value);
  }
  
  if (selectedStatus.value !== 'all') {
    entries = entries.filter(e => e.status === selectedStatus.value);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    entries = entries.filter(e =>
      e.queue_number.toLowerCase().includes(query) ||
      e.player_name.toLowerCase().includes(query) ||
      e.contact.toLowerCase().includes(query)
    );
  }
  
  return entries;
});

const stats = computed(() => roundStore.currentRound?.stats);

onMounted(async () => {
  loading.value = true;
  try {
    await roundStore.loadRoundWithStats(roundId);
    await queueStore.loadEntries(roundId);
    queueStore.subscribeToEntries(roundId);
  } catch (error) {
    console.error('Failed to load round:', error);
  } finally {
    loading.value = false;
  }
});

async function handleOpenRound() {
  if (!confirm('เปิดรับคิวรอบนี้หรือไม่?')) return;
  try {
    await roundStore.openRound(roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleCloseAccepting() {
  if (!confirm('ปิดรับคิวรอบนี้หรือไม่?')) return;
  try {
    await roundStore.closeRoundAccepting(roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleReopenRound() {
  showReopenModal.value = true;
}

async function confirmReopenRound() {
  try {
    await roundStore.reopenRound(roundId, reopenReason.value || 'เปิดรับคิวเพิ่ม');
    showReopenModal.value = false;
    reopenReason.value = '';
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleCompleteRound() {
  if (!confirm('ทำเครื่องหมายว่าเสร็จสิ้นรอบนี้หรือไม่?')) return;
  try {
    await roundStore.completeRound(roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleCancelRound() {
  if (!confirm('ยกเลิก รอบนี้หรือไม่?')) return;
  try {
    await roundStore.cancelRound(roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleManualCall(entryId: string) {
  if (!confirm('ต้องการเรียกคิวนี้หรือไม่?')) return;
  try {
    await queueStore.manualCall(entryId, roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleComplete(entryId: string) {
  if (!confirm('ทำเครื่องหมายว่าเสร็จสิ้นหรือไม่?')) return;
  try {
    await queueStore.complete(entryId, roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleNoShow(entryId: string) {
  if (!confirm('ทำเครื่องหมายว่าไม่มาหรือไม่?')) return;
  try {
    await queueStore.markNoShow(entryId, roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

async function handleCancel(entryId: string) {
  if (!confirm('ยกเลิกคิวนี้หรือไม่?')) return;
  try {
    await queueStore.cancel(entryId, roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาด');
  }
}

function canCall(entry: QueueEntry) {
  return (
    entry.status === 'waiting' ||
    entry.status === 'selected' ||
    entry.status === 'cancelled'
  );
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

function getPositionLabel(position: QueueEntry['position']) {
  return POSITION_LABELS[position];
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else-if="roundStore.currentRound" class="space-y-6">
      <!-- Header with Actions -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Round #{{ roundStore.currentRound.round_number }}
          </h1>
          <p class="text-gray-600">
            {{ new Date(roundStore.currentRound.event_date).toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <span
            v-if="roundStore.currentRound.accepting_entries"
            class="badge bg-green-500"
          >
            เปิดรับคิว
          </span>
          <span
            :class="['badge', ROUND_STATUS_COLORS[roundStore.currentRound.status]]"
          >
            {{ ROUND_STATUS_LABELS[roundStore.currentRound.status] }}
          </span>
        </div>
      </div>
      
      <!-- Admin Actions -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">จัดการรอบ</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-if="!roundStore.currentRound.accepting_entries"
            @click="handleOpenRound"
            class="btn-success"
          >
            เปิดรับคิว
          </button>
          <button
            v-if="roundStore.currentRound.accepting_entries"
            @click="handleCloseAccepting"
            class="btn-secondary"
          >
            ปิดรับคิว
          </button>
          <button
            v-if="!roundStore.currentRound.accepting_entries && roundStore.currentRound.status !== 'completed'"
            @click="handleReopenRound"
            class="btn-primary"
          >
            เปิดรับคิวเพิ่ม
          </button>
          <button
            v-if="roundStore.currentRound.status !== 'completed'"
            @click="handleCompleteRound"
            class="btn-primary"
          >
            Complete Round
          </button>
          <button
            v-if="roundStore.currentRound.status !== 'cancelled' && roundStore.currentRound.status !== 'completed'"
            @click="handleCancelRound"
            class="btn-danger"
          >
            ยกเลิกรอบ
          </button>
        </div>
      </div>
      
      <!-- Stats -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div class="card text-center">
          <div class="text-2xl font-bold">{{ stats.support.total }}</div>
          <div class="text-sm text-gray-600">Support Total</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ stats.support.waiting }}</div>
          <div class="text-sm text-gray-600">Support Waiting</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.support.completed }}</div>
          <div class="text-sm text-gray-600">Support Completed</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold">{{ stats.general.total }}</div>
          <div class="text-sm text-gray-600">General Total</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ stats.general.waiting }}</div>
          <div class="text-sm text-gray-600">General Waiting</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.general.completed }}</div>
          <div class="text-sm text-gray-600">General Completed</div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ตำแหน่ง</label>
            <select v-model="selectedPosition" class="input-field">
              <option value="all">ทั้งหมด</option>
              <option value="support">Support</option>
              <option value="general">ทั่วไป</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select v-model="selectedStatus" class="input-field">
              <option value="all">ทั้งหมด</option>
              <option value="waiting">รอ</option>
              <option value="selected">ถูกสุ่ม</option>
              <option value="called">ถูกเรียก</option>
              <option value="serving">กำลังให้บริการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="no_show">ไม่มา</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              v-model="searchQuery"
              type="text"
              class="input-field"
              placeholder="หมายเลขคิว, ชื่อ, Contact"
            />
          </div>
        </div>
      </div>
      
      <!-- Queue Table -->
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตำแหน่ง</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in filteredEntries" :key="entry.id">
              <td class="px-4 py-3 font-bold text-gray-900">{{ entry.queue_number }}</td>
              <td class="px-4 py-3">{{ entry.player_name }}</td>
              <td class="px-4 py-3">
                <span class="badge" :class="entry.position === 'support' ? 'bg-blue-500' : 'bg-green-500'">
                  {{ getPositionLabel(entry.position) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="getStatusColor(entry.status)">
                  {{ getStatusLabel(entry.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ new Date(entry.created_at).toLocaleTimeString('th-TH') }}
              </td>
              <td class="px-4 py-3">
                <div class="flex space-x-2">
                  <button
                    v-if="canCall(entry)"
                    @click="handleManualCall(entry.id)"
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    📢 เรียก
                  </button>
                  <button
                    v-if="canComplete(entry)"
                    @click="handleComplete(entry.id)"
                    class="text-green-600 hover:text-green-800 text-sm"
                  >
                    ✅ เสร็จ
                  </button>
                  <button
                    v-if="canComplete(entry)"
                    @click="handleNoShow(entry.id)"
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    ⚠️ ไม่มา
                  </button>
                  <button
                    v-if="entry.status === 'waiting' || entry.status === 'selected'"
                    @click="handleCancel(entry.id)"
                    class="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="filteredEntries.length === 0" class="text-center py-8 text-gray-500">
          ไม่พบข้อมูลคิว
        </div>
      </div>
    </div>
    
    <!-- Reopen Modal -->
    <div v-if="showReopenModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">เปิดรับคิวเพิ่ม</h2>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            เหตุผล (ไม่บังคับ)
          </label>
          <textarea
            v-model="reopenReason"
            class="input-field"
            rows="3"
            placeholder="ระบุเหตุผลที่เปิดรับคิวเพิ่ม"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <button @click="showReopenModal = false" class="btn-secondary">
            ยกเลิก
          </button>
          <button @click="confirmReopenRound" class="btn-primary">
            เปิดรับคิว
          </button>
        </div>
      </div>
    </div>
  </div>
</template>