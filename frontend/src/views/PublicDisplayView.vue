<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import * as roundService from '@/services/round.service';
import * as queueService from '@/services/queue.service';
import type { Round, QueueEntry } from '@/types';
import { POSITION_LABELS } from '@/constants';

const currentRound = ref<Round | null>(null);
const callingSupport = ref<QueueEntry | null>(null);
const callingGeneral = ref<QueueEntry | null>(null);
const loading = ref(true);

async function loadCurrentRound() {
  try {
    const rounds = await roundService.getRounds({
      status: 'processing',
      accepting_entries: true
    });
    
    if (rounds.length > 0) {
      currentRound.value = rounds[0];
      await loadCallingQueues();
    }
  } catch (error) {
    console.error('Failed to load current round:', error);
  } finally {
    loading.value = false;
  }
}

async function loadCallingQueues() {
  if (!currentRound.value) return;
  
  try {
    const entries = await queueService.getQueueEntries(currentRound.value.id);
    
    // Find latest called queues for each position
    const calledSupport = entries.filter(
      e => e.position === 'support' && e.status === 'called'
    );
    const calledGeneral = entries.filter(
      e => e.position === 'general' && e.status === 'called'
    );
    
    callingSupport.value = calledSupport.length > 0 
      ? calledSupport[calledSupport.length - 1] 
      : null;
    callingGeneral.value = calledGeneral.length > 0 
      ? calledGeneral[calledGeneral.length - 1] 
      : null;
  } catch (error) {
    console.error('Failed to load calling queues:', error);
  }
}

let subscription: any = null;

onMounted(async () => {
  await loadCurrentRound();
  
  // Subscribe to realtime updates
  if (currentRound.value) {
    subscription = queueService.subscribeToQueueEntries(
      currentRound.value.id,
      () => {
        loadCallingQueues();
      }
    );
  }
  
  // Refresh every 30 seconds
  const interval = setInterval(loadCurrentRound, 30000);
  onUnmounted(() => {
    clearInterval(interval);
    if (subscription) {
      subscription.unsubscribe();
    }
  });
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-8">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">
          📺 NOW CALLING
        </h1>
        <p class="text-xl text-blue-100">
          กรุณาติดต่อเจ้าหน้าที่เมื่อเรียกคิวของคุณ
        </p>
      </div>
      
      <div v-if="loading" class="text-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        <p class="text-white text-xl mt-4">กำลังโหลด...</p>
      </div>
      
      <div v-else-if="!currentRound" class="text-center py-16">
        <p class="text-white text-2xl">
          ไม่มีรอบที่เปิดอยู่ในขณะนี้
        </p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Support -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="text-center">
            <div class="bg-blue-500 text-white px-6 py-3 rounded-lg inline-block mb-6">
              <h2 class="text-2xl font-bold">
                {{ POSITION_LABELS.support }}
              </h2>
            </div>
            
            <div v-if="callingSupport" class="space-y-4">
              <div class="text-6xl font-bold text-blue-600">
                {{ callingSupport.queue_number }}
              </div>
              <div class="text-2xl text-gray-800">
                {{ callingSupport.player_name }}
              </div>
              <div class="text-lg text-gray-600">
                เรียกเมื่อ: {{ new Date(callingSupport.called_at!).toLocaleTimeString('th-TH') }}
              </div>
            </div>
            
            <div v-else class="text-gray-400 text-xl py-8">
              ยังไม่มีการเรียกคิว
            </div>
          </div>
        </div>
        
        <!-- General -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="text-center">
            <div class="bg-green-500 text-white px-6 py-3 rounded-lg inline-block mb-6">
              <h2 class="text-2xl font-bold">
                {{ POSITION_LABELS.general }}
              </h2>
            </div>
            
            <div v-if="callingGeneral" class="space-y-4">
              <div class="text-6xl font-bold text-green-600">
                {{ callingGeneral.queue_number }}
              </div>
              <div class="text-2xl text-gray-800">
                {{ callingGeneral.player_name }}
              </div>
              <div class="text-lg text-gray-600">
                เรียกเมื่อ: {{ new Date(callingGeneral.called_at!).toLocaleTimeString('th-TH') }}
              </div>
            </div>
            
            <div v-else class="text-gray-400 text-xl py-8">
              ยังไม่มีการเรียกคิว
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="currentRound" class="text-center mt-8">
        <p class="text-white text-lg">
          Round #{{ currentRound.round_number }} - 
          {{ new Date(currentRound.event_date).toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) }}
        </p>
      </div>
    </div>
  </div>
</template>