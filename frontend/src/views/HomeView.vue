<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoundStore } from '@/stores/round.store';
import { POSITION_LABELS, ROUND_STATUS_LABELS, ROUND_STATUS_COLORS } from '@/constants';
import type { Round } from '@/types';

const roundStore = useRoundStore();
const selectedDate = ref<string>(new Date().toISOString().split('T')[0]);

const acceptingRounds = ref<Round[]>([]);

onMounted(async () => {
  await roundStore.loadRounds();
  updateAcceptingRounds();
});

function updateAcceptingRounds() {
  acceptingRounds.value = roundStore.acceptingRounds.filter(
    r => r.event_date === selectedDate.value
  );
}

function handleDateChange() {
  updateAcceptingRounds();
}

function goToQueue(roundId: string) {
  window.location.href = `/queue?round=${roundId}`;
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        ระบบจัดการคิวเกม
      </h1>
      <p class="text-gray-600">
        ลงคิวและตรวจสอบสถานะคิวของคุณได้ง่ายๆ
      </p>
    </div>

    <div class="card mb-6">
      <h2 class="text-xl font-semibold mb-4">เลือกรอบที่ต้องการ</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          วันที่
        </label>
        <input
          v-model="selectedDate"
          type="date"
          class="input-field"
          @change="handleDateChange"
        />
      </div>

      <div v-if="roundStore.loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">กำลังโหลด...</p>
      </div>

      <div v-else-if="acceptingRounds.length === 0" class="text-center py-8">
        <p class="text-gray-500">
          ยังไม่มีรอบที่เปิดรับคิวในวันที่เลือก
        </p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="round in acceptingRounds"
          :key="round.id"
          class="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="goToQueue(round.id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Round #{{ round.round_number }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ new Date(round.event_date).toLocaleDateString('th-TH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'badge',
                  ROUND_STATUS_COLORS[round.status]
                ]"
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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <router-link
        to="/queue"
        class="card text-center hover:shadow-lg transition-shadow"
      >
        <div class="text-3xl mb-2">📝</div>
        <h3 class="font-semibold text-gray-900">ลงคิว</h3>
        <p class="text-sm text-gray-600 mt-1">ลงทะเบียนเข้าคิว</p>
      </router-link>

      <router-link
        to="/status"
        class="card text-center hover:shadow-lg transition-shadow"
      >
        <div class="text-3xl mb-2">🔍</div>
        <h3 class="font-semibold text-gray-900">ตรวจสอบสถานะ</h3>
        <p class="text-sm text-gray-600 mt-1">ดูสถานะคิวของคุณ</p>
      </router-link>

      <router-link
        to="/display"
        class="card text-center hover:shadow-lg transition-shadow"
      >
        <div class="text-3xl mb-2">📺</div>
        <h3 class="font-semibold text-gray-900">จอแสดงผล</h3>
        <p class="text-sm text-gray-600 mt-1">ดูคิวที่กำลังเรียก</p>
      </router-link>
    </div>
  </div>
</template>