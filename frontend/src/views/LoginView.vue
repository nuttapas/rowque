<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function handleLogin() {
  loading.value = true;
  error.value = null;
  
  try {
    await authStore.login(email.value, password.value);
    
    const redirect = route.query.redirect as string;
    if (redirect) {
      router.push(redirect);
    } else if (authStore.isAdmin) {
      router.push('/admin');
    } else if (authStore.isStaff) {
      router.push('/staff');
    } else {
      router.push('/');
    }
  } catch (err: any) {
    error.value = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">
        เข้าสู่ระบบ
      </h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            อีเมล
          </label>
          <input
            v-model="email"
            type="email"
            class="input-field"
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            รหัสผ่าน
          </label>
          <input
            v-model="password"
            type="password"
            class="input-field"
            placeholder="••••••••"
            required
          />
        </div>
        
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ error }}</p>
        </div>
        
        <button
          type="submit"
          class="w-full btn-primary py-3"
          :disabled="loading"
        >
          {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600">
        <p>สำหรับ Staff และ Admin เท่านั้น</p>
        <router-link to="/" class="text-blue-600 hover:text-blue-800">
          ← กลับหน้าหลัก
        </router-link>
      </div>
    </div>
  </div>
</template>