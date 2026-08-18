<script setup lang="ts">
import { ref } from 'vue';
import * as queueService from '@/services/queue.service';
import type { QueueEntry } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, POSITION_LABELS } from '@/constants';

const searchType = ref<'queue_number' | 'contact'>('queue_number');
const searchValue = ref('');
const loading = ref(false);
const results = ref<QueueEntry[]>([]);
const error = ref<string | null>(null);

async function handleSearch() {
  if (!searchValue.value.trim()) {
    error.value = 'กรุณากรอกข้อมูลค้นหา';
    return;
  }
  
  loading.value = true;
  error.value = null;
  results.value = [];
  
  try {
    if (searchType.value === 'queue_number') {
      const entry = await queueService.getQueueByNumber(searchValue.value.trim());
      if (entry) {
        results.value = [entry];
      }
    } else {
      results.value = await queueService.getQueueByContact(searchValue.value.trim());
    }
    
    if (results.value.length === 0) {
      error.value = 'ไม่พบข้อมูลคิว';
    }
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาดในการค้นหา';
  } finally {
    loading.value = false;
  }
}

function getPositionLabel(position: QueueEntry['position']) {
  return POSITION_LABELS[position];
}

function getStatusLabel(status: QueueEntry['status']) {
  return STATUS_LABELS[status];
}

function getStatusColor(status: QueueEntry['status']) {
  return STATUS_COLORS[status];
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        ตรวจสอบสถานะคิว
      </h1>
      
      <div class="mb-6">
        <div class="flex space-x-4 mb-4">
          <button
            @click="searchType = 'queue_number'"
            class="flex-1 py-2 px-4 rounded-lg transition-colors"
            :class="searchType === 'queue_number' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
          >
            ค้นหาด้วยหมายเลขคิว
          </button>
          <button
            @click="searchType = 'contact'"
            class="flex-1 py-2 px-4 rounded-lg transition-colors"
            :class="searchType === 'contact' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
          >
            ค้นหาด้วย Contact
          </button>
        </div>
        
        <div class="flex space-x-2">
          <input
            v-model="searchValue"
            :type="searchType === 'queue_number' ? 'text' : 'tel'"
            class="input-field flex-1"
            :placeholder="searchType === 'queue_number' ? 'เช่น S-001, G-023' : 'เบอร์โทรศัพท์หรือ contact'"
            @keyup.enter="handleSearch"
          />
          <button
            @click="handleSearch"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? '...' : 'ค้นหา' }}
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">กำลังค้นหา...</p>
      </div>
      
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
      </div>
      
      <div v-if="results.length > 0" class="space-y-4">
        <div
          v-for="entry in results"
          :key="entry.id"
          class="border rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="text-2xl font-bold text-gray-900">
              {{ entry.queue_number }}
            </div>
            <span
              :class="['badge', getStatusColor(entry.status)]"
            >
              {{ getStatusLabel(entry.status) }}
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-600">ชื่อ:</span>
              <span class="ml-2 font-medium">{{ entry.player_name }}</span>
            </div>
            <div>
              <span class="text-gray-600">ตำแหน่ง:</span>
              <span class="ml-2 font-medium">{{ getPositionLabel(entry.position) }}</span>
            </div>
            <div>
              <span class="text-gray-600">รอบ:</span>
              <span class="ml-2 font-medium">#{{ entry.round_id }}</span>
            </div>
            <div>
              <span class="text-gray-600">ลงคิวเมื่อ:</span>
              <span class="ml-2 font-medium">{{ new Date(entry.created_at).toLocaleString('th-TH') }}</span>
            </div>
          </div>
          
          <div v-if="entry.status === 'called'" class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-blue-800 font-semibold">
              📢 คิวของคุณถูกเรียกแล้ว! กรุณาติดต่อเจ้าหน้าที่
            </p>
          </div>
          
          <div v-if="entry.status === 'selected'" class="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p class="text-purple-800 font-semibold">
              🎲 คุณถูกสุ่มเลือกแล้ว รอการเรียกจากเจ้าหน้าที่
            </p>
          </div>
          
          <div v-if="entry.status === 'completed'" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-green-800 font-semibold">
              ✅ ทำรายการเสร็จสิ้น
            </p>
          </div>
          
          <div v-if="entry.status === 'no_show'" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-red-800 font-semibold">
              ⚠️ ไม่มาตามการเรียก
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>