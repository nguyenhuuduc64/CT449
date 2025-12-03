<template>
  <div class="app">
    <header class="app-header">
      <h1>Hệ thống mượn sách thư viện</h1>
      <nav>
        <router-link to="/">Trang chủ</router-link>
        <router-link to="/catalog">Danh mục sách</router-link>
        <router-link v-if="isAdmin" to="/admin">Quản trị</router-link>
        <router-link v-if="!isAuthenticated" to="/login">Đăng nhập</router-link>
        <template v-else>
          <button class="link-button" @click="goProfile">Xin chào, {{ userName }}</button>
          <button class="link-button" @click="logout" aria-label="Đăng xuất">
            <!-- simple logout icon (door with arrow) -->
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </template>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated as authIsAuthenticated, isAdmin as authIsAdmin, getUser } from './utils/auth';

const router = useRouter();

const isAuthenticated = computed(() => authIsAuthenticated());
const isAdmin = computed(() => authIsAdmin());

const userName = computed(() => {
  const u = getUser();
  return u?.name || u?.email || '';
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Perform a full reload to re-initialize router and remove admin route
  window.location.href = '/login';
};

const goProfile = () => {
  router.push('/profile');
};
</script>