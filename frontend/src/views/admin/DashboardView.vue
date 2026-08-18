<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { ROUND_STATUS_LABELS, ROUND_STATUS_COLORS } from '@/constants';

const router = useRouter();
const roundStore = useRoundStore();

onMounted(async () => {
  await roundStore.loadRounds();
  roundStore.subscribeToRounds();
});

function goToRound(roundId: string) {
  router.push(`/admin/rounds/${roundId}`);
}

function goToRoundsList() {
  router.push('/admin/rounds');
}

function goToStaff() {
  router.push('/admin/staff');
}

function goToLogs() {
  router.push('/admin/logs');
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Admin Dashboard
      </h1>
      <p class="text-gray-600">จัดการระบบทั้งหมด</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card cursor-pointer hover:shadow-lg transition-shadow" @click="goToRoundsList()">
        <div class="flex items-center">
          <div class="text-4xl mr-4">📅</div>
          <div>
            <div class="text-2xl font-bold">{{ roundStore.rounds.length }}</div>
            <div class="text-gray-600">รอบทั้งหมด</div>
          </div>
        </div>
      </div>
      
      <div class="card cursor-pointer hover:shadow-lg transition-shadow" @click="goToRoundsList()">
        <div class="flex items-center">
          <div class="text-4xl mr-4">🟢</div>
          <div>
            <div class="text-2xl font-bold text-green-600">
              {{ roundStore.acceptingRounds.length }}
            </div>
            <div class="text-gray-600">เปิดรับคิว</div>
          </div>
        </div>
      </div>
      
      <div class="card cursor-pointer hover:shadow-lg transition-shadow" @click="goToStaff()">
        <div class="flex items-center">
          <div class="text-4xl mr-4">👥</div>
          <div>
            <div class="text-2xl font-bold text-blue-600">Staff</div>
            <div class="text-gray-600">จัดการ Staff</div>
          </div>
        </div>
      </div>
      
      <div class="card cursor-pointer hover:shadow-lg transition-shadow" @click="goToLogs()">
        <div class="flex items-center">
          <div class="text-4xl mr-4">📜</div>
          <div>
            <div class="text-2xl font-bold text-purple-600">Logs</div>
            <div class="text-gray-600">Audit Logs</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="text-xl font-semibold mb-4">รอบล่าสุด</h2>
      
      <div v-if="roundStore.loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="round in roundStore.rounds.slice(0, 5)"
          :key="round.id"
          class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="goToRound(round.id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Round #{{ round.round_number }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ new Date(round.event_date).toLocaleDateString('th-TH') }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <span
                :class="['badge', ROUND_STATUS_COLORS[round.status]]"
              >
                {{ ROUND_STATUS_LABELS[round.status] }}
              </span>
              <span
                v-if="round.accepting_entries"
                class="badge bg-green-500"
              >
                เปิดรับคิว
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>