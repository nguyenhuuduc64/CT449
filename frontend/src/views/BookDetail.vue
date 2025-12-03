<template>
  <div class="home">
    <div class="card" v-if="book">
      <div style="display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 2fr); gap: 1.5rem">
        <div>
          <div class="book-card-cover" style="height: 260px">
            <img
              v-if="book.coverImage"
              :src="coverSrc"
              :alt="book.title"
            />
            <div v-else class="book-card-placeholder">
              <span>{{ initials }}</span>
            </div>
          </div>
        </div>
        <div>
          <h2 style="margin-top: 0">{{ book.title }}</h2>
          <p style="margin: 0.25rem 0; font-size: 0.95rem">
            Tác giả: <strong>{{ book.author }}</strong>
          </p>
          <p style="margin: 0.15rem 0; font-size: 0.9rem">
            Thể loại: {{ book.genre || "Chưa xác định" }} • Năm xuất bản:
            {{ book.year || "N/A" }}
          </p>
          <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #4b5563">
            {{ book.description || "Chưa có mô tả chi tiết cho đầu sách này." }}
          </p>
          <p style="margin: 0.5rem 0; font-size: 0.9rem">
            Trạng thái:
            <span
              class="badge"
              :class="book.quantity > 0 ? 'badge-success' : 'badge-danger'"
            >
              {{ book.quantity > 0 ? "Còn sách" : "Hết sách" }}
            </span>
          </p>
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem">
            <button class="btn btn-primary" @click="toggleBorrowForm">
              {{ book.quantity > 0 ? "Mượn sách" : "Đặt trước" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- form mượn/đặt ẩn/hiện -->
    <div
      v-if="showForm && book"
      class="card"
      style="max-width: 480px; margin-top: 1rem"
    >
      <h3>{{ book.quantity > 0 ? "Mượn sách" : "Đặt trước sách" }}</h3>
      <p style="font-size: 0.9rem; color: #4b5563">
        {{ book.title }} — {{ book.author }}
      </p>
      <p style="font-size: 0.85rem; color: #6b7280">
        Xác nhận {{ book.quantity > 0 ? "mượn" : "đặt trước" }} đầu sách này.
      </p>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: flex-end">
        <button class="btn btn-secondary" @click="toggleBorrowForm">Hủy</button>
        <button class="btn btn-primary" :disabled="processing" @click="confirmBorrow">
          {{ processing ? "Đang xử lý..." : "Xác nhận" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../api";

const route = useRoute();

const book = ref(null);
const showForm = ref(false);
const processing = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/i, "");

const coverSrc = computed(() => {
  if (!book.value?.coverImage) return "";
  const src = book.value.coverImage;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`;
  return `${API_ORIGIN}/${src}`;
});

const initials = computed(() => {
  if (!book.value) return "";
  const parts = book.value.title.split(" ");
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
});

const loadBook = async () => {
  try {
    const { data } = await api.get(`/books/${route.params.id}`);
    book.value = data;
  } catch (e) {
    // ignore: có thể hiển thị thông báo nếu cần
  }
};

const toggleBorrowForm = () => {
  showForm.value = !showForm.value;
  if (!showForm.value) {
    processing.value = false;
  }
};

const confirmBorrow = async () => {
  if (!book.value) return;
  processing.value = true;
  try {
    await api.post("/borrow/borrow", { bookId: book.value._id });
    alert("Mượn sách thành công!");
    showForm.value = false;
    processing.value = false;
    await loadBook();
  } catch (e) {
    alert(e.response?.data?.message || "Không thể mượn sách");
    processing.value = false;
  }
};

onMounted(loadBook);
</script>


