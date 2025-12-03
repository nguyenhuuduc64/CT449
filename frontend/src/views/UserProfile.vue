<template>
  <div class="home">
    <div class="card" style="max-width: 520px">
      <h2>Tài khoản của tôi</h2>
      <p style="margin: 0 0 1rem; font-size: 0.9rem; color: #6b7280">
        Thông tin cá nhân đang sử dụng trong hệ thống thư viện.
      </p>

      <!-- Hiển thị thông tin (read-only) -->
      <div v-if="!isEditing">
        <div class="form-group">
          <label>Họ và tên</label>
          <div>{{ form.name }}</div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <div>{{ form.email }}</div>
        </div>
        <div class="form-group">
          <label>Số điện thoại</label>
          <div>{{ form.phone || "Chưa cập nhật" }}</div>
        </div>
        <div class="form-group">
          <label>Vai trò</label>
          <div>{{ form.role }}</div>
        </div>
        <button class="btn btn-primary" @click="isEditing = true">
          Chỉnh sửa
        </button>
      </div>

      <!-- Form chỉnh sửa, chỉ hiện khi nhấn nút -->
      <form v-else @submit.prevent="updateProfile">
        <div class="form-group">
          <label>Họ và tên</label>
          <input v-model="form.name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input :value="form.email" disabled />
        </div>
        <div class="form-group">
          <label>Số điện thoại</label>
          <input v-model="form.phone" placeholder="Nhập số điện thoại..." />
        </div>
        <div class="form-group">
          <label>Vai trò</label>
          <input :value="form.role" disabled />
        </div>
        <div style="display: flex; gap: 0.5rem">
          <button class="btn btn-primary" :disabled="loading">
            Lưu thay đổi
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelEdit"
          >
            Hủy
          </button>
        </div>
        <p v-if="message" style="color: #15803d; margin-top: 0.5rem">
          {{ message }}
        </p>
        <p v-if="error" style="color: #b91c1c; margin-top: 0.5rem">
          {{ error }}
        </p>
      </form>
    </div>

    <div class="card">
      <h2>Lịch sử mượn sách</h2>
      <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #6b7280">
        Các lượt mượn và trả sách gần đây của bạn.
      </p>
      <table v-if="borrows.length" class="table">
        <thead>
          <tr>
            <th>Sách</th>
            <th>Ngày mượn</th>
            <th>Hạn trả</th>
            <th>Trạng thái</th>
            <th>Tiền phạt</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in borrows" :key="b._id">
            <td>{{ b.book?.title }}</td>
            <td>{{ formatDate(b.borrowedAt) }}</td>
            <td>{{ formatDate(b.dueDate) }}</td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-success': b.status === 'returned',
                  'badge-warning': b.status === 'borrowed',
                  'badge-danger': b.status === 'overdue'
                }"
              >
                {{
                  b.status === 'borrowed'
                    ? 'Đang mượn'
                    : b.status === 'returned'
                    ? 'Đã trả'
                    : 'Quá hạn'
                }}
              </span>
            </td>
            <td>{{ b.lateFee }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Chưa có lịch sử mượn sách.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../api";

const form = ref({
  name: "",
  email: "",
  phone: "",
  role: ""
});

const loading = ref(false);
const error = ref("");
const message = ref("");
const borrows = ref([]);
const isEditing = ref(false);

const loadProfile = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get("/users/me");
    form.value = {
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      role: data.role
    };
  } catch (e) {
    error.value = "Không thể tải thông tin tài khoản";
  } finally {
    loading.value = false;
  }
};

const updateProfile = async () => {
  loading.value = true;
  error.value = "";
  message.value = "";
  try {
    const { data } = await api.put("/users/me", {
      name: form.value.name,
      phone: form.value.phone
    });
    message.value = "Cập nhật thông tin thành công";
    localStorage.setItem('user', JSON.stringify(data));
  } catch (e) {
    error.value = "Không thể cập nhật thông tin";
  } finally {
    loading.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  message.value = "";
  error.value = "";
  loadProfile();
};

const loadBorrows = async () => {
  try {
    const { data } = await api.get("/borrow/me");
    borrows.value = data;
  } catch (e) {
    // ignore
  }
};

const formatDate = (val) => {
  if (!val) return "-";
  return new Date(val).toLocaleDateString();
};

onMounted(async () => {
  await loadProfile();
  await loadBorrows();
});
</script>


