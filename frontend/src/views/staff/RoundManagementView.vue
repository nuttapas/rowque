<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { useQueueStore } from '@/stores/queue.store';
import { POSITION_LABELS, STATUS_LABELS, STATUS_COLORS, ERROR_MESSAGES } from '@/constants';
import type { QueuePosition, QueueEntry } from '@/types';

const route = useRoute();
const roundStore = useRoundStore();
const queueStore = useQueueStore();

const roundId = route.params.id as string;
const selectedPosition = ref<QueuePosition | 'all'>('all');
const selectedStatus = ref<QueueEntry['status'] | 'all'>('all');
const searchQuery = ref('');
const loading = ref(false);
const randomResult = ref<QueueEntry | null>(null);
const randomLoading = ref(false);
const showRandomModal = ref(false);
const confirmLoading = ref(false);

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

const stats = computed(() => {
  if (!roundStore.currentRound) return null;
  return roundStore.currentRound.stats;
});

onMounted(async () => {
  loading.value = true;
  try {
    await roundStore.loadRoundWithStats(roundId);
    await queueStore.loadEntries(roundId);
    
    // Subscribe to realtime updates
    queueStore.subscribeToEntries(roundId);
  } catch (error) {
    console.error('Failed to load round:', error);
  } finally {
    loading.value = false;
  }
});

async function handleRandom(position: QueuePosition) {
  randomLoading.value = true;
  try {
    const result = await queueStore.randomSelect(roundId, position);
    if (result.success && result.data) {
      randomResult.value = result.data as QueueEntry;
      showRandomModal.value = true;
    } else {
      alert(result.message || ERROR_MESSAGES[result.code || 'NETWORK_ERROR']);
    }
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาดในการสุ่ม');
  } finally {
    randomLoading.value = false;
  }
}

async function confirmRandom() {
  confirmLoading.value = true;
  try {
    await queueStore.confirmRandom(roundId);
    showRandomModal.value = false;
    randomResult.value = null;
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาดในการยืนยัน');
  } finally {
    confirmLoading.value = false;
  }
}

async function rejectRandom() {
  try {
    await queueStore.rejectRandom(roundId);
    showRandomModal.value = false;
    randomResult.value = null;
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาดในการยกเลิก');
  }
}

async function handleManualCall(entryId: string) {
  if (!confirm('ต้องการเรียกคิวนี้หรือไม่?')) return;
  try {
    await queueStore.manualCall(entryId, roundId);
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาดในการเรียกคิว');
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
  return entry.status === 'waiting' || entry.status === 'selected';
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
      <!-- Header -->
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
            :class="['badge', roundStore.currentRound.status === 'processing' ? 'bg-blue-500' : 'bg-gray-500']"
          >
            {{ roundStore.currentRound.status }}
          </span>
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
      
      <!-- Random Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          @click="handleRandom('support')"
          :disabled="randomLoading"
          class="btn-primary py-4 text-lg"
        >
          🎲 สุ่ม Support
        </button>
        <button
          @click="handleRandom('general')"
          :disabled="randomLoading"
          class="btn-primary py-4 text-lg"
        >
          🎲 สุ่ม ทั่วไป
        </button>
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
    
    <!-- Random Result Modal -->
    <div v-if="showRandomModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="text-4xl mb-4">🎲</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">ผลการสุ่ม</h2>
          
          <div v-if="randomResult" class="space-y-3 mb-6">
            <div class="text-3xl font-bold text-blue-600">{{ randomResult.queue_number }}</div>
            <div class="text-xl text-gray-800">{{ randomResult.player_name }}</div>
            <div class="text-gray-600">
              ตำแหน่ง: {{ getPositionLabel(randomResult.position) }}
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="rejectRandom"
              class="btn-secondary py-3"
              :disabled="confirmLoading"
            >
              สุ่มใหม่
            </button>
            <button
              @click="confirmRandom"
              class="btn-primary py-3"
              :disabled="confirmLoading"
            >
              {{ confirmLoading ? '...' : 'ยืนยัน' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>