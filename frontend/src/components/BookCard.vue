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
        {{ book.quantity > 0 ? 'Còn sách' : 'Hết sách' }}
      </span>
    </div>
    <div class="book-card-body">
      <h4>{{ book.title }}</h4>
      <p class="book-card-author">Tác giả: {{ book.author }}</p>
      <p class="book-card-desc">
        {{ book.description || 'Chưa có mô tả.' }}
      </p>
    </div>
    <div class="book-card-footer">
      <button
        class="btn btn-primary"
        @click.stop="$emit('borrow', book)"
      >
        {{ book.quantity > 0 ? 'Mượn sách' : 'Đặt trước' }}
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


