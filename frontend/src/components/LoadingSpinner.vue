<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}>();

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-16 w-16'
};
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div
      :class="['animate-spin rounded-full border-b-2 border-blue-600', sizeClasses[size || 'md']]"
    ></div>
    <p v-if="text" class="mt-2 text-gray-600 text-sm">
      {{ text }}
    </p>
  </div>
</template>