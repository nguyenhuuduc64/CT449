<template>
  <div class="home">
    <!-- Hero / Search -->
    <section class="home-hero">
      <div class="home-hero-text">
        <p class="home-badge">Thư viện số của bạn</p>
        <h2>Khám phá, mượn và đọc hàng ngàn đầu sách.</h2>
        <p class="home-subtitle">
          Tìm kiếm theo tiêu đề, tác giả hoặc thể loại và quản lý lịch sử mượn
          sách của bạn.
        </p>
        <form class="home-search" @submit.prevent="searchBooks">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm sách theo tiêu đề, tác giả hoặc thể loại..."
            @input="onSearchInput"
            @focus="showSuggestions = true"
            @blur="() => setTimeout(() => (showSuggestions = false), 150)"
          />
          <button class="btn btn-primary" type="submit">Search</button>
        </form>
        <div v-if="showSuggestions && suggestions.length" class="search-suggestions">
          <ul>
            <li v-for="s in suggestions" :key="s.type+s.value" @mousedown.prevent="applySuggestion(s)">
              <span class="suggest-text">{{ s.value }}</span>
              <span class="suggest-type">{{ s.type === 'title' ? 'Tiêu đề' : 'Tác giả' }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="home-hero-visual">
        <div class="home-hero-stat-row">
          <div class="home-hero-stat card">
            <p class="home-stat-label">Số đầu sách</p>
            <p class="home-stat-value">{{ totalBooks }}</p>
          </div>
          <div class="home-hero-stat card">
            <p class="home-stat-label">Danh mục</p>
            <p class="home-stat-value">{{ categories.length }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured books -->
    <section class="home-section">
      <div class="home-section-header">
        <h3>Sách nổi bật</h3>
        <p>Những đầu sách đang được mượn nhiều và gợi ý cho bạn.</p>
      </div>
      <div class="home-books-grid">
        <BookCard
          v-for="book in featuredBooks"
          :key="book._id"
          :book="book"
          @borrow="openBorrowForm"
        />
        <p v-if="!featuredBooks.length" class="home-empty">
          Chưa có sách nổi bật.
        </p>
      </div>
    </section>

    <!-- Categories -->
    <section
      v-for="category in categories"
      :key="category"
      class="home-section"
    >
      <div class="home-section-header">
        <h3>{{ category }}</h3>
        <p>Khám phá các đầu sách {{ category.toLowerCase() }} phổ biến.</p>
      </div>
      <div class="home-books-grid">
        <BookCard
          v-for="book in booksByCategory(category)"
          :key="book._id"
          :book="book"
          @borrow="openBorrowForm"
        />
        <p v-if="!booksByCategory(category).length" class="home-empty">
          Chưa có sách trong danh mục này.
        </p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="home-footer">
      <div class="home-footer-content">
        <div>
          <h4>Thư viện Trung tâm</h4>
          <p>123 Đường Thư Viện, Quận 1, TP. HCM</p>
          <p>Email: lienhe@thuvien.example</p>
          <p>Điện thoại: (+84) 123 456 789</p>
        </div>
        <div class="home-footer-links">
          <p>Kết nối với chúng tôi</p>
          <div class="home-social-links">
            <a href="#">Facebook</a>
            <a href="#">Zalo</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </div>
      <p class="home-footer-copy">
        © {{ new Date().getFullYear() }} Thư viện Trung tâm
      </p>
    </footer>

    <!-- Borrow / Reserve form (hidden until click) -->
    <div
      v-if="selectedBook"
      class="card"
      style="
        max-width: 480px;
        position: fixed;
        right: 1.5rem;
        bottom: 1.5rem;
        z-index: 30;
      "
    >
      <h3>{{ selectedBook.quantity > 0 ? "Mượn sách" : "Đặt trước sách" }}</h3>
      <p style="font-size: 0.9rem; color: #4b5563">
        {{ selectedBook.title }} — {{ selectedBook.author }}
      </p>
      <div v-if="activeBorrows.length" class="active-borrows">
        <h4 style="margin:0 0 0.35rem; font-size:0.95rem">Những sách bạn chưa trả ({{ activeBorrows.length }})</h4>
        <ul class="active-borrows-list" style="margin:0 0 0.6rem; padding:0; list-style:none;">
          <li v-for="b in activeBorrows" :key="b._id" style="display:flex; gap:0.6rem; align-items:center;">
            <span style="flex:1; font-size:0.9rem; color:#111827"><strong>{{ b.book?.title || b.bookTitle || '—' }}</strong></span>
            <span style="font-size:0.85rem; color:#6b7280">Hạn: {{ formatDate(b.dueDate) }}</span>
            <span :class="['badge', badgeClass(b.status)]" style="margin-left:0.6rem">{{ b.status }}</span>
          </li>
        </ul>
      </div>
      <div v-if="borrowMessage" :class="['borrow-message', borrowMessageType]">
        {{ borrowMessage }}
      </div>
      <div style="font-size: 0.9rem; color: #111827; margin-top: 0.5rem">
        <div><strong>Ngày mượn:</strong> {{ borrowDate }}</div>
        <div><strong>Hạn trả:</strong> {{ dueDate }}</div>
      </div>
      <p style="font-size: 0.85rem; color: #6b7280; margin-top:0.5rem">
        Xác nhận {{ selectedBook.quantity > 0 ? "mượn" : "đặt trước" }} đầu sách này.
      </p>
      <div
        style="
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
          justify-content: flex-end;
        "
      >
        <button class="btn btn-secondary" @click="closeBorrowForm">Hủy</button>
        <button
          class="btn btn-primary"
          :disabled="processing"
          @click="confirmBorrow"
        >
          {{ processing ? "Đang xử lý..." : "Xác nhận" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../api";
import BookCard from "../components/BookCard.vue";

const books = ref([]);
const searchQuery = ref("");
const selectedBook = ref(null);
const processing = ref(false);
const borrowDate = ref('');
const dueDate = ref('');
const borrowDateISO = ref('');
const dueDateISO = ref('');
const borrowMessage = ref('');
const borrowMessageType = ref('');
const activeBorrows = ref([]);

const filteredBooks = computed(() => {
  if (!searchQuery.value.trim()) return books.value;
  const q = searchQuery.value.toLowerCase();
  return books.value.filter((b) => {
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.genre || "").toLowerCase().includes(q)
    );
  });
});

const categories = computed(() => {
  const set = new Set(filteredBooks.value.map((b) => b.genre).filter(Boolean));
  return Array.from(set);
});

const featuredBooks = computed(() =>
  [...filteredBooks.value]
    .sort((a, b) => (b.borrowedCount || 0) - (a.borrowedCount || 0))
    .slice(0, 6)
);

const totalBooks = computed(() => books.value.length);

const booksByCategory = (category) =>
  filteredBooks.value.filter((b) => b.genre === category);

const loadBooks = async () => {
  try {
    const { data } = await api.get("/books");
    books.value = data;
  } catch (e) {
    // ignore for now; in real app show toast
  }
};

// Suggestions for search (titles and authors)
const suggestions = ref([]);
const showSuggestions = ref(false);
let suggestTimer = null;

const gatherSuggestions = () => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    suggestions.value = [];
    return;
  }
  const titleMatches = books.value
    .map(b => b.title)
    .filter(Boolean)
    .filter(t => t.toLowerCase().includes(q));
  const authorMatches = books.value
    .map(b => b.author)
    .filter(Boolean)
    .filter(a => a.toLowerCase().includes(q));
  const uniqTitles = Array.from(new Set(titleMatches)).slice(0,4).map(v => ({ type: 'title', value: v }));
  const uniqAuthors = Array.from(new Set(authorMatches)).slice(0,4).map(v => ({ type: 'author', value: v }));
  suggestions.value = [...uniqTitles, ...uniqAuthors].slice(0,6);
};

const onSearchInput = () => {
  // debounce suggestions
  if (suggestTimer) clearTimeout(suggestTimer);
  suggestTimer = setTimeout(() => {
    gatherSuggestions();
    showSuggestions.value = true;
  }, 250);
};

const applySuggestion = (s) => {
  searchQuery.value = s.value;
  showSuggestions.value = false;
};

const searchBooks = () => {
  // filtering is reactive, so nothing needed here
};

const openBorrowForm = async (book) => {
  try {
    const { data } = await api.get('/borrow/me');
    const active = (data || []).filter(b => b.status === 'borrowed' || b.status === 'overdue');
    // update active borrows list so it's visible in the form
    activeBorrows.value = active;
    if (active.length >= 3) {
      borrowMessage.value = 'Bạn đã mượn đủ 3 cuốn. Vui lòng trả sách trước khi mượn thêm.';
      borrowMessageType.value = 'error';
      return;
    }
  } catch (e) {
    // If the check fails, allow opening the form but warn in console
    console.warn('Could not verify current borrows', e);
  }
  // clear any previous messages when opening the form
  borrowMessage.value = '';
  borrowMessageType.value = '';
  const now = new Date();
  const then = new Date(now);
  then.setDate(then.getDate() + 7);
  borrowDate.value = now.toLocaleDateString();
  dueDate.value = then.toLocaleDateString();
  borrowDateISO.value = now.toISOString();
  dueDateISO.value = then.toISOString();

  selectedBook.value = book;
};

const closeBorrowForm = () => {
  selectedBook.value = null;
  processing.value = false;
  borrowMessage.value = '';
  borrowMessageType.value = '';
  // keep activeBorrows in memory; user may want to see them elsewhere
};

const confirmBorrow = async () => {
  if (!selectedBook.value) return;
  processing.value = true;
  try {
    await api.post("/borrow/borrow", { bookId: selectedBook.value._id, borrowDate: borrowDateISO.value, dueDate: dueDateISO.value });
    await loadBooks();
    borrowMessage.value = 'Đang chờ duyệt';
    borrowMessageType.value = 'success';
    // refresh active borrows so user sees updated list
    await loadActiveBorrows();
    // small delay to show message then close
    setTimeout(() => {
      closeBorrowForm();
    }, 900);
  } catch (e) {
    borrowMessage.value = e.response?.data?.message || "Không thể mượn sách";
    borrowMessageType.value = 'error';
    processing.value = false;
  }
};

// load the current user's active borrows (borrowed / overdue)
const loadActiveBorrows = async () => {
  try {
    const { data } = await api.get('/borrow/me');
    activeBorrows.value = (data || []).filter(b => b.status === 'borrowed' || b.status === 'overdue');
  } catch (e) {
    activeBorrows.value = [];
  }
};

const formatDate = (d) => {
  try {
    return d ? new Date(d).toLocaleDateString() : '-';
  } catch (e) {
    return '-';
  }
};

const badgeClass = (status) => {
  if (!status) return '';
  if (status === 'overdue') return 'badge-warning';
  if (status === 'borrowed') return 'badge-success';
  return '';
};

onMounted(() => {
  loadBooks();
  loadActiveBorrows();
});
</script>
