<template>
  <article class="book-card" @click="goToDetail">
    <div class="book-card-cover">
      <img
        v-if="book.coverImage"
        :src="coverSrc"
        :alt="book.title"
      />
      <div v-else class="book-card-placeholder">
        <span>{{ initials }}</span>
      </div>
      <span
        class="book-card-badge"
        :class="{
          'badge-success': book.quantity > 0,
          'badge-danger': book.quantity === 0
        }"
      >
        {{ book.quantity > 0 ? 'Có sách' : 'Hết sách' }}
      </span>
    </div>
    <div class="book-card-body">
      <h4>{{ book.title }}</h4>
      <p class="book-card-author">Tác giả: {{ book.author }}</p>
      <p class="book-card-desc">
        {{ book.description || 'Chưa có mô tả.' }}
      </p>
      <!-- Thêm thông báo khi hết sách -->
      <div v-if="book.quantity === 0" class="out-of-stock-notice">
        <span>⚠️ Sách đã được mượn hết</span>
      </div>
    </div>
    <div class="book-card-footer">
      <button
        class="btn btn-primary"
        @click.stop="$emit('borrow', book)"
        :disabled="book.quantity === 0"
        :class="{ 'btn-disabled': book.quantity === 0 }"
      >
        {{ book.quantity > 0 ? 'Mượn sách' : 'Đã mượn hết' }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['borrow']);

const router = useRouter();

const goToDetail = () => {
  router.push({ name: "book-detail", params: { id: props.book._id } });
};

// Determine backend origin from configured Vite API base (which may include /api)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/i, "");

const coverSrc = computed(() => {
  const src = props.book.coverImage || "";
  if (!src) return "";
  // If already absolute URL, return it
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // If relative path (starts with '/'), join with API origin
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`;
  // Otherwise assume it's relative to uploads
  return `${API_ORIGIN}/${src}`;
});

const initials = computed(() => {
  const parts = props.book.title.split(" ");
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
});
</script>

<style scoped>
.book-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.book-card-cover {
  position: relative;
  height: 180px;
  background: #f3f4f6;
}

.book-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 2rem;
  font-weight: bold;
}

.book-card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.badge-success {
  background-color: #10b981;
}

.badge-danger {
  background-color: #ef4444;
}

.book-card-body {
  padding: 1rem;
  flex: 1;
}

.book-card-body h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.4;
}

.book-card-author {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.book-card-desc {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.out-of-stock-notice {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fef3c7;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #92400e;
  text-align: center;
}

.book-card-footer {
  padding: 0 1rem 1rem;
}

.btn {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-primary:disabled,
.btn-disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-primary:disabled:hover,
.btn-disabled:hover {
  background-color: #9ca3af;
}
</style>