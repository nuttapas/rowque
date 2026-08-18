import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getCurrentUser, signOut, onAuthStateChange } from '@/services/auth.service';
import type { Profile, UserRole } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const profile = ref<Profile | null>(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => profile.value?.role === 'admin');
  const isStaff = computed(() => 
    profile.value?.role === 'staff' || profile.value?.role === 'admin'
  );
  const isPlayer = computed(() => 
    !profile.value || profile.value?.role === 'player'
  );

  async function init() {
    loading.value = true;
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        user.value = currentUser.user;
        profile.value = currentUser.profile;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    } finally {
      loading.value = false;
    }

    // Subscribe to auth changes
    onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          user.value = currentUser.user;
          profile.value = currentUser.profile;
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null;
        profile.value = null;
      }
    });
  }

  async function login(email: string, password: string) {
    const { signIn } = await import('@/services/auth.service');
    await signIn(email, password);
    await init();
  }

  async function logout() {
    await signOut();
    user.value = null;
    profile.value = null;
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isStaff,
    isPlayer,
    init,
    login,
    logout
  };
});