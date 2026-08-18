import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as queueService from '@/services/queue.service';
import type { QueueEntry, QueuePosition, QueueStatus } from '@/types';

export const useQueueStore = defineStore('queue', () => {
  const entries = ref<QueueEntry[]>([]);
  const selectedEntries = ref<QueueEntry[]>([]);
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

  async function randomSelect(roundId: string, position: QueuePosition, count = 1) {
    const result = await queueService.randomSelectQueue(roundId, position, count);
    if (result.success && result.data) {
      selectedEntries.value = selectedEntries.value.concat(result.data as QueueEntry[]);
      // Refresh entries
      await loadEntries(roundId);
    }
    return result as any;
  }

  // Confirm/Reject workflow deprecated in frontend; random/manual selection now immediately mark as called

  async function manualCall(entryId: string, roundId: string) {
    const result = await queueService.manualCallQueue(entryId);
    if (result.success) {
      // fetch the updated entry and show as currently calling
      const entry = await queueService.getQueueEntry(entryId);
      if (entry) {
        // ensure not duplicating
        if (!selectedEntries.value.find(e => e.id === entry.id)) {
          selectedEntries.value.push(entry);
        }
      }
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
      // Update selected entries if any match
      const selIndex = selectedEntries.value.findIndex(e => e.id === entry.id);
      if (selIndex !== -1) {
        selectedEntries.value[selIndex] = entry;
      }
    });
  }

  function clearSelected() {
    selectedEntries.value = [];
  }

  return {
    entries,
    selectedEntries,
    loading,
    loadEntries,
    registerQueue,
    randomSelect,
    // confirmRandom/rejectRandom omitted — frontend uses called immediately
    manualCall,
    complete,
    markNoShow,
    cancel,
    subscribeToEntries,
    clearSelected
  };
});