import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as roundService from '@/services/round.service';
import type { Round, RoundWithStats } from '@/types';

export const useRoundStore = defineStore('round', () => {
  const rounds = ref<Round[]>([]);
  const currentRound = ref<RoundWithStats | null>(null);
  const loading = ref(false);

  const activeRounds = computed(() => 
    rounds.value.filter(r => r.status === 'open' || r.status === 'processing')
  );

const acceptingRounds = computed(() =>
  rounds.value.filter(r => r.accepting_entries)
);

  async function loadRounds(filters?: { status?: Round['status'] }) {
    loading.value = true;
    try {
      rounds.value = await roundService.getRounds(filters);
    } catch (error) {
      console.error('Failed to load rounds:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function loadRoundWithStats(roundId: string) {
    loading.value = true;
    try {
      currentRound.value = await roundService.getRoundWithStats(roundId);
      return currentRound.value;
    } catch (error) {
      console.error('Failed to load round:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createRound(eventDate: string) {
    const newRound = await roundService.createRound(eventDate);
    rounds.value.unshift(newRound);
    return newRound;
  }

  async function updateRound(roundId: string, updates: Partial<Round>) {
    const updatedRound = await roundService.updateRound(roundId, updates);
    const index = rounds.value.findIndex(r => r.id === roundId);
    if (index !== -1) {
      rounds.value[index] = updatedRound;
    }
    if (currentRound.value?.id === roundId) {
      currentRound.value = { ...currentRound.value, ...updatedRound };
    }
    return updatedRound;
  }

  async function openRound(roundId: string) {
    await roundService.openRound(roundId);
    await loadRoundWithStats(roundId);
    await loadRounds();
  }

  async function closeRoundAccepting(roundId: string) {
    await roundService.closeRoundAccepting(roundId);
    await loadRoundWithStats(roundId);
    await loadRounds();
  }

  async function reopenRound(roundId: string, reason?: string) {
    await roundService.reopenRound(roundId, reason);
    await loadRoundWithStats(roundId);
    await loadRounds();
  }

  async function completeRound(roundId: string) {
    await roundService.completeRound(roundId);
    await loadRoundWithStats(roundId);
    await loadRounds();
  }

  async function cancelRound(roundId: string) {
    await roundService.cancelRound(roundId);
    await loadRoundWithStats(roundId);
    await loadRounds();
  }

  function subscribeToRounds() {
    return roundService.subscribeToRounds((round) => {
      const index = rounds.value.findIndex(r => r.id === round.id);
      if (index !== -1) {
        rounds.value[index] = round;
      } else {
        rounds.value.unshift(round);
      }
      if (currentRound.value?.id === round.id) {
        loadRoundWithStats(round.id);
      }
    });
  }

  return {
    rounds,
    currentRound,
    loading,
    activeRounds,
    acceptingRounds,
    loadRounds,
    loadRoundWithStats,
    createRound,
    updateRound,
    openRound,
    closeRoundAccepting,
    reopenRound,
    completeRound,
    cancelRound,
    subscribeToRounds
  };
});