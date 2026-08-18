import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/queue',
      name: 'queue',
      component: () => import('@/views/QueueRegistrationView.vue')
    },
    {
      path: '/status',
      name: 'status',
      component: () => import('@/views/QueueStatusView.vue')
    },
    {
      path: '/display',
      name: 'display',
      component: () => import('@/views/PublicDisplayView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/staff',
      name: 'staff',
      component: () => import('@/views/staff/DashboardView.vue'),
      meta: { requiresAuth: true, requiresStaff: true }
    },
    {
      path: '/staff/round/:id',
      name: 'staff-round',
      component: () => import('@/views/staff/RoundManagementView.vue'),
      meta: { requiresAuth: true, requiresStaff: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/rounds',
      name: 'admin-rounds',
      component: () => import('@/views/admin/RoundsListView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/rounds/:id',
      name: 'admin-round',
      component: () => import('@/views/admin/RoundManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/staff',
      name: 'admin-staff',
      component: () => import('@/views/admin/StaffManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/logs',
      name: 'admin-logs',
      component: () => import('@/views/admin/AuditLogsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' });
    return;
  }
  
  if (to.meta.requiresStaff && !authStore.isStaff) {
    next({ name: 'home' });
    return;
  }
  
  next();
});

export default router;