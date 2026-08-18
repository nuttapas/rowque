import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as queueService from '@/services/queue.service';
import type { QueueEntry, QueuePosition, QueueStatus } from '@/types';

export const useQueueStore = defineStore('queue', () => {
  const entries = ref<QueueEntry[]>([]);
  const selectedEntry = ref<QueueEntry | null>(null);
  const loading = ref(false);

  async function loadEntries(roundId: string, filters?: {
    position?: QueuePosition;
    status?: QueueStatus;
    search?: string;
  }) {
    loading.value = true;
    try {
      entries.value = await queueService.getQueueEntries(roundId, filters);
    } catch (error) {
      console.error('Failed to load queue entries:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function registerQueue(
    roundId: string,
    playerName: string,
    contact: string,
    position: QueuePosition
  ) {
    const result = await queueService.registerQueue(roundId, playerName, contact, position);
    await loadEntries(roundId);
    return result;
  }

  async function randomSelect(roundId: string, position: QueuePosition) {
    const result = await queueService.randomSelectQueue(roundId, position);
    if (result.success && result.data) {
      selectedEntry.value = result.data as QueueEntry;
      // Refresh entries
      await loadEntries(roundId);
    }
    return result;
  }

  async function confirmRandom(roundId: string) {
    if (!selectedEntry.value) throw new Error('No selected entry');
    const result = await queueService.confirmRandomQueue(selectedEntry.value.id);
    if (result.success) {
      selectedEntry.value = null;
      await loadEntries(roundId);
    }
    return result;
  }

  async function rejectRandom(roundId: string) {
    if (!selectedEntry.value) throw new Error('No selected entry');
    const result = await queueService.rejectRandomQueue(selectedEntry.value.id);
    if (result.success) {
      selectedEntry.value = null;
      await loadEntries(roundId);
    }
    return result;
  }

  async function manualCall(entryId: string, roundId: string) {
    const result = await queueService.manualCallQueue(entryId);
    if (result.success) {
      await loadEntries(roundId);
    }
    return result;
  }

  async function complete(entryId: string, roundId: string) {
    const result = await queueService.completeQueue(entryId);
    if (result.success) {
      await loadEntries(roundId);
    }
    return result;
  }

  async function markNoShow(entryId: string, roundId: string) {
    const result = await queueService.markNoShow(entryId);
    if (result.success) {
      await loadEntries(roundId);
    }
    return result;
  }

  async function cancel(entryId: string, roundId: string) {
    const result = await queueService.cancelQueue(entryId);
    if (result.success) {
      await loadEntries(roundId);
    }
    return result;
  }

  function subscribeToEntries(roundId: string) {
    return queueService.subscribeToQueueEntries(roundId, (entry) => {
      const index = entries.value.findIndex(e => e.id === entry.id);
      if (index !== -1) {
        entries.value[index] = entry;
      } else {
        entries.value.push(entry);
      }
      // Update selected entry if it matches
      if (selectedEntry.value?.id === entry.id) {
        selectedEntry.value = entry;
      }
    });
  }

  function clearSelected() {
    selectedEntry.value = null;
  }

  return {
    entries,
    selectedEntry,
    loading,
    loadEntries,
    registerQueue,
    randomSelect,
    confirmRandom,
    rejectRandom,
    manualCall,
    complete,
    markNoShow,
    cancel,
    subscribeToEntries,
    clearSelected
  };
});