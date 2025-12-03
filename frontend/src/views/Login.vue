<template>
  <div class="login-container">
    <h2>Đăng nhập</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          required 
          placeholder="Nhập email của bạn"
        />
      </div>
      <div class="form-group">
        <label for="password">Mật khẩu</label>
        <input 
          id="password" 
          v-model="password" 
          type="password" 
          required 
          placeholder="Nhập mật khẩu"
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
      <div style="text-align:center; margin-top:1rem">
        <div id="googleBtn"></div>
        <p style="margin-top:0.5rem; color:#6b7280">hoặc đăng nhập bằng Google</p>
      </div>
    </form>
    <p class="register-link">
      Chưa có tài khoản? 
      <router-link to="/register">Đăng ký ngay</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../api';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    });

    // Save token and user data to localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    // Redirect to the intended URL or home and reload to initialize routes
    const redirectPath = route.query.redirect || '/';
    // Use a full navigation so the app reloads and dynamic routes are applied
    window.location.href = redirectPath;
  } catch (err) {
    error.value = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};

const loadGoogle = async () => {
  try {
    const { data } = await api.get('/auth/google/client-id');
    const clientId = data.clientId;
    if (!clientId) return;

    // load Google Identity Services script
    if (!window.google) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const idToken = response.credential;
          const res = await api.post('/auth/google', { idToken });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          const redirectPath = route.query.redirect || '/';
          window.location.href = redirectPath;
        } catch (err) {
          error.value = err.response?.data?.message || 'Google sign-in failed';
        }
      }
    });

    window.google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      { theme: 'outline', size: 'large', width: '320' }
    );
  } catch (e) {
    // ignore if google fails to load
    console.warn('Google Identity failed to load', e);
  }
};

onMounted(() => {
  loadGoogle();
});
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #1a202c;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.error {
  color: #e53e3e;
  margin-top: 1rem;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
}

.register-link a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>