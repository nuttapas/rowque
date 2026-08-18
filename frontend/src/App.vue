<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  await authStore.init();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-xl font-bold text-gray-900">
              🎮 RowQue
            </router-link>
            <div class="hidden md:flex space-x-4">
              <router-link to="/queue" class="text-gray-600 hover:text-gray-900">
                ลงคิว
              </router-link>
              <router-link to="/status" class="text-gray-600 hover:text-gray-900">
                ตรวจสอบสถานะ
              </router-link>
              <router-link to="/display" class="text-gray-600 hover:text-gray-900">
                จอแสดงผล
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <span class="text-sm text-gray-600">
                {{ authStore.profile?.display_name }}
                <span v-if="authStore.isAdmin" class="text-red-600">(Admin)</span>
                <span v-else-if="authStore.isStaff" class="text-blue-600">(Staff)</span>
              </span>
              <router-link
                v-if="authStore.isAdmin"
                to="/admin"
                class="text-sm text-red-600 hover:text-red-800"
              >
                Admin
              </router-link>
              <router-link
                v-else-if="authStore.isStaff"
                to="/staff"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                Staff
              </router-link>
              <button
                @click="authStore.logout()"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                ออกจากระบบ
              </button>
            </template>
            <template v-else>
              <router-link
                to="/login"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                เข้าสู่ระบบ
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <main class="py-6">
      <RouterView />
    </main>

    <footer class="bg-white border-t mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500">
          © 2026 RowQue - Game Queue Management System
        </p>
      </div>
    </footer>
  </div>
</template>