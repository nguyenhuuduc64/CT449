<template>
  <div class="auth-layout">
    <section class="auth-hero">
      <div>
        <h2>Tham gia thư viện</h2>
        <p>Tạo tài khoản để mượn sách, theo dõi lịch sử và nhận nhắc nhở hạn trả.</p>
      </div>
      <p class="auth-hero-footer">
        Đăng ký hoàn toàn miễn phí và chỉ mất vài phút.
      </p>
    </section>

    <div class="card auth-card">
      <h2>Tạo tài khoản</h2>
      <form @submit.prevent="register">
        <div class="form-group">
          <label>Họ và tên</label>
          <input v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input v-model="form.password" type="password" required minlength="6" />
        </div>
        <button class="btn btn-primary" :disabled="loading">
          Đăng ký
        </button>
        <p style="margin-top: 0.5rem; font-size: 0.85rem">
          Đã có tài khoản?
          <router-link to="/login">Đăng nhập</router-link>
        </p>
        <p v-if="error" style="color: #b91c1c; margin-top: 0.5rem">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();

const form = ref({
  name: '',
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const register = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.post('/auth/register', form.value);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed';
  } finally {
    loading.value = false;
  }
};
</script>


