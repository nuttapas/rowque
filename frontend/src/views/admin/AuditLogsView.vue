<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as auditService from '@/services/audit.service';
import type { AuditLog } from '@/types';

const logs = ref<AuditLog[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    logs.value = await auditService.getAuditLogs({ limit: 100 });
  } catch (error) {
    console.error('Failed to load audit logs:', error);
  } finally {
    loading.value = false;
  }
});

function formatAction(action: string) {
  return action.replace(/_/g, ' ');
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Audit Logs</h1>
      <p class="text-gray-600">บันทึกการทำงานทั้งหมด</p>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
    
    <div v-else class="card overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="log in logs" :key="log.id">
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ new Date(log.created_at).toLocaleString('th-TH') }}
            </td>
            <td class="px-4 py-3">
              <span class="badge bg-blue-500">
                {{ formatAction(log.action) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
              {{ log.entity_type }}
              <span v-if="log.entity_id" class="text-gray-500 text-xs">({{ log.entity_id.slice(0, 8) }}...)</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              {{ (log as any).profiles?.display_name || 'System' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              <pre class="text-xs">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="logs.length === 0" class="text-center py-8 text-gray-500">
        ยังไม่มีบันทึก
      </div>
    </div>
  </div>
</template>