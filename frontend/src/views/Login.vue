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
      <div class="google-login-section">
        <div class="divider">
          <span>Hoặc đăng nhập với</span>
        </div>
        <div id="googleButtonContainer"></div>
        <p v-if="googleError" class="error">{{ googleError }}</p>
      </div>
    </form>
    <p class="register-link">
      Chưa có tài khoản? 
      <router-link to="/register">Đăng ký ngay</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../api';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const googleError = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    const redirectPath = route.query.redirect || '/';
    window.location.href = redirectPath;
  } catch (err) {
    error.value = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};

// Debug: Log environment variables
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Initialize Google Sign-In
const initializeGoogleSignIn = async () => {
  try {
    // Check if Google Client ID is available
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found in environment variables');
      googleError.value = 'Cấu hình Google chưa được thiết lập. Vui lòng liên hệ quản trị viên.';
      return;
    }

    console.log('Initializing Google Sign-In with client ID:', clientId);

    // Load Google Identity Services script
    if (!window.google) {
      console.log('Loading Google Identity Services script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-signin-script';
      
      // Add error handling for script loading
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script');
        googleError.value = 'Không thể tải dịch vụ Google. Vui lòng kiểm tra kết nối internet.';
      };
      
      document.head.appendChild(script);
      
      // Wait for script to load with timeout
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout loading Google script'));
        }, 10000); // 10 second timeout
        
        script.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
      });
    }

    console.log('Google script loaded, initializing...');

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup'
    });

    console.log('Google initialized, rendering button...');

    // Render Google Sign-In button
    const container = document.getElementById('googleButtonContainer');
    if (container) {
      window.google.accounts.id.renderButton(
        container,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: container.offsetWidth || 320
        }
      );
      console.log('Google button rendered');
    } else {
      console.error('Google button container not found');
    }

  } catch (err) {
    console.error('Failed to initialize Google Sign-In:', err);
    googleError.value = 'Không thể khởi tạo đăng nhập Google. Vui lòng thử lại sau.';
  }
};

// Handle Google credential response
const handleGoogleCredentialResponse = async (response) => {
  console.log('Google credential received:', response);
  
  try {
    googleError.value = '';
    
    if (!response.credential) {
      throw new Error('No credential received from Google');
    }

    console.log('Sending idToken to backend...');

    // Send idToken to backend
    const result = await api.post('/auth/google', {
      idToken: response.credential
    });

    console.log('Backend response:', result.data);

    // Save token and user data
    localStorage.setItem('token', result.data.token);
    localStorage.setItem('user', JSON.stringify(result.data.user));

    // Redirect to home or intended URL
    const redirectPath = route.query.redirect || '/';
    console.log('Redirecting to:', redirectPath);
    window.location.href = redirectPath;

  } catch (err) {
    console.error('Google login error:', err);
    console.error('Error details:', err.response?.data);
    
    if (err.response?.status === 403) {
      googleError.value = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
    } else if (err.response?.data?.message) {
      googleError.value = err.response.data.message;
    } else if (err.message === 'Network Error') {
      googleError.value = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    } else {
      googleError.value = 'Đăng nhập Google thất bại. Vui lòng thử lại.';
    }
  }
};

// Alternative Google login method using redirect
const handleGoogleLoginRedirect = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
  const scope = encodeURIComponent('email profile');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
  
  window.location.href = authUrl;
};

// Cleanup function
const cleanupGoogleSignIn = () => {
  if (window.google?.accounts?.id?.cancel) {
    window.google.accounts.id.cancel();
  }
};

onMounted(() => {
  console.log('Login component mounted');
  
  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    initializeGoogleSignIn();
  }, 300);
});

onUnmounted(() => {
  cleanupGoogleSignIn();
});
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #1a202c;
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

button[type="submit"] {
  width: 100%;
  padding: 0.75rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background-color 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #4338ca;
}

button[type="submit"]:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.error {
  color: #e53e3e;
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
  background-color: #fed7d7;
  border-radius: 4px;
}

.google-login-section {
  margin-top: 1.5rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #718096;
  font-size: 0.9rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.divider::before {
  margin-right: 0.75rem;
}

.divider::after {
  margin-left: 0.75rem;
}

#googleButtonContainer {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  min-height: 50px;
}

#googleButtonContainer > div {
  width: 100% !important;
  max-width: 320px;
}

#googleButtonContainer iframe {
  width: 100% !important;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #718096;
  font-size: 0.95rem;
}

.register-link a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
}

.register-link a:hover {
  text-decoration: underline;
}

/* Loading indicator */
.loading-indicator {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>