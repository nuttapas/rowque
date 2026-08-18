<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { ROUND_STATUS_LABELS, ROUND_STATUS_COLORS } from '@/constants';
import type { Round } from '@/types';

const router = useRouter();
const roundStore = useRoundStore();
const showCreateModal = ref(false);
const newEventDate = ref(new Date().toISOString().split('T')[0]);
const creating = ref(false);

onMounted(async () => {
  await roundStore.loadRounds();
});

function goToRound(roundId: string) {
  router.push(`/admin/rounds/${roundId}`);
}

async function handleCreateRound() {
  if (!newEventDate.value) return;
  
  creating.value = true;
  try {
    await roundStore.createRound(newEventDate.value);
    showCreateModal.value = false;
    newEventDate.value = new Date().toISOString().split('T')[0];
    await roundStore.loadRounds();
  } catch (error: any) {
    alert(error.message || 'เกิดข้อผิดพลาดในการสร้างรอบ');
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">จัดการรอบ</h1>
        <p class="text-gray-600">สร้างและจัดการรอบทั้งหมด</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary">
        + สร้างรอบใหม่
      </button>
    </div>
    
    <div v-if="roundStore.loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เปิดรับคิว</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สร้างเมื่อ</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="round in roundStore.rounds"
            :key="round.id"
            class="cursor-pointer hover:bg-gray-50"
            @click="goToRound(round.id)"
          >
            <td class="px-4 py-3 font-bold text-gray-900">#{{ round.round_number }}</td>
            <td class="px-4 py-3">{{ new Date(round.event_date).toLocaleDateString('th-TH') }}</td>
            <td class="px-4 py-3">
              <span class="badge" :class="ROUND_STATUS_COLORS[round.status]">
                {{ ROUND_STATUS_LABELS[round.status] }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="round.accepting_entries ? 'text-green-600' : 'text-red-600'"
                class="font-medium"
              >
                {{ round.accepting_entries ? 'เปิด' : 'ปิด' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ new Date(round.created_at).toLocaleString('th-TH') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">สร้างรอบใหม่</h2>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            วันที่
          </label>
          <input
            v-model="newEventDate"
            type="date"
            class="input-field"
            required
          />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <button @click="showCreateModal = false" class="btn-secondary">
            ยกเลิก
          </button>
          <button
            @click="handleCreateRound"
            class="btn-primary"
            :disabled="creating || !newEventDate"
          >
            {{ creating ? '...' : 'สร้าง' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>