<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { ROUND_STATUS_LABELS, ROUND_STATUS_COLORS } from '@/constants';

const router = useRouter();
const roundStore = useRoundStore();

onMounted(async () => {
  await roundStore.loadRounds();
});

function goToRound(roundId: string) {
  router.push(`/staff/round/${roundId}`);
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Staff Dashboard
      </h1>
      <p class="text-gray-600">จัดการรอบและคิวผู้เล่น</p>
    </div>
    
    <div v-if="roundStore.loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="round in roundStore.rounds"
        :key="round.id"
        class="card cursor-pointer hover:shadow-lg transition-shadow"
        @click="goToRound(round.id)"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900">
            Round #{{ round.round_number }}
          </h3>
          <span
            :class="['badge', ROUND_STATUS_COLORS[round.status]]"
          >
            {{ ROUND_STATUS_LABELS[round.status] }}
          </span>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">วันที่:</span>
            <span class="font-medium">{{ new Date(round.event_date).toLocaleDateString('th-TH') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">เปิดรับคิว:</span>
            <span
              :class="round.accepting_entries ? 'text-green-600' : 'text-red-600'"
              class="font-medium"
            >
              {{ round.accepting_entries ? 'เปิด' : 'ปิด' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>