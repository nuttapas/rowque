<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoundStore } from '@/stores/round.store';
import { useQueueStore } from '@/stores/queue.store';
import { POSITION_LABELS } from '@/constants';
import type { QueuePosition } from '@/types';

const route = useRoute();
const router = useRouter();
const roundStore = useRoundStore();
const queueStore = useQueueStore();

const selectedRoundId = ref<string>(route.query.round as string || '');
const playerName = ref('');
const contact = ref('');
const selectedPosition = ref<QueuePosition>('general');
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<any>(null);

const selectedRound = computed(() => 
  roundStore.rounds.find(r => r.id === selectedRoundId.value)
);

onMounted(async () => {
  await roundStore.loadRounds();
  
  // Auto-select first accepting round if none selected
  if (!selectedRoundId.value && roundStore.acceptingRounds.length > 0) {
    selectedRoundId.value = roundStore.acceptingRounds[0].id;
  }
});

async function handleSubmit() {
  if (!selectedRoundId.value) {
    error.value = 'กรุณาเลือกรอบ';
    return;
  }
  
  if (!playerName.value.trim()) {
    error.value = 'กรุณากรอกชื่อ';
    return;
  }
  
  if (!contact.value.trim()) {
    error.value = 'กรุณากรอกข้อมูลติดต่อ';
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const result = await queueStore.registerQueue(
      selectedRoundId.value,
      playerName.value.trim(),
      contact.value.trim(),
      selectedPosition.value
    );
    
    success.value = {
      queueNumber: result.id, // This will be updated after loading entry
      round: selectedRound.value
    };
    
    // Reload to get the actual queue number
    await queueStore.loadEntries(selectedRoundId.value);
    const entry = queueStore.entries.find(e => e.id === result.id);
    if (entry) {
      success.value.queueNumber = entry.queue_number;
      success.value.position = entry.position;
    }
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาดในการลงคิว';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  playerName.value = '';
  contact.value = '';
  success.value = null;
  error.value = null;
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        ลงคิวผู้เล่น
      </h1>
      
      <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div class="text-center">
          <div class="text-4xl mb-4">✅</div>
          <h2 class="text-xl font-semibold text-green-800 mb-4">
            ลงคิวสำเร็จ
          </h2>
          <div class="grid grid-cols-2 gap-4 text-left max-w-xs mx-auto">
            <div class="text-gray-600">Queue:</div>
            <div class="font-bold text-gray-900">{{ success.queueNumber }}</div>
            
            <div class="text-gray-600">Round:</div>
            <div class="font-bold text-gray-900">#{{ success.round?.round_number }}</div>
            
            <div class="text-gray-600">Position:</div>
            <div class="font-bold text-gray-900">{{ POSITION_LABELS[success.position] }}</div>
            
            <div class="text-gray-600">สถานะ:</div>
            <div class="font-bold text-yellow-600">กำลังรอ</div>
          </div>
          <button
            @click="resetForm"
            class="mt-6 btn-primary"
          >
            ลงคิวเพิ่มเติม
          </button>
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            รอบ <span class="text-red-500">*</span>
          </label>
          <select
            v-model="selectedRoundId"
            class="input-field"
            required
          >
            <option value="">-- เลือกรอบ --</option>
            <option
              v-for="round in roundStore.acceptingRounds"
              :key="round.id"
              :value="round.id"
            >
              Round #{{ round.round_number }} - {{ new Date(round.event_date).toLocaleDateString('th-TH') }}
              {{ round.accepting_entries ? '(เปิดรับคิว)' : '(ปิดรับคิว)' }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ตำแหน่ง <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label
              v-for="(label, value) in POSITION_LABELS"
              :key="value"
              class="relative flex items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              :class="{ 'border-blue-500 bg-blue-50': selectedPosition === value }"
            >
              <input
                type="radio"
                :value="value"
                v-model="selectedPosition"
                class="sr-only"
              />
              <span class="font-medium">{{ label }}</span>
            </label>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ชื่อ-นามสกุล <span class="text-red-500">*</span>
          </label>
          <input
            v-model="playerName"
            type="text"
            class="input-field"
            placeholder="กรอกชื่อและนามสกุล"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            เบอร์โทรศัพท์ / Contact <span class="text-red-500">*</span>
          </label>
          <input
            v-model="contact"
            type="text"
            class="input-field"
            placeholder="กรอกเบอร์โทรศัพท์หรือช่องทางติดต่อ"
            required
          />
        </div>
        
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ error }}</p>
        </div>
        
        <button
          type="submit"
          class="w-full btn-primary py-3 text-lg"
          :disabled="loading || !selectedRoundId"
        >
          {{ loading ? 'กำลังลงคิว...' : 'ลงคิว' }}
        </button>
      </form>
    </div>
  </div>
</template>