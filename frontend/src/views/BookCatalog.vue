<template>
  <div class="home">
    <section class="card" style="margin-bottom: 1rem">
      <div class="home-section-header">
        <h3>Tất cả sách</h3>
        <p>Tìm kiếm sách theo tên, tác giả hoặc thể loại</p>
      </div>
      <div class="grid filters-row">
        <div class="form-group filters-search" style="flex:1">
          <label>Tìm kiếm</label>
          <input 
            v-model="filters.q" 
            placeholder="Nhập tên sách hoặc tác giả..."
            @input="onCatalogInput"
            @focus="catalogShowSuggestions = true"
            @blur="() => setTimeout(() => (catalogShowSuggestions = false), 150)"
          />
          <div v-if="catalogShowSuggestions && catalogSuggestions.length" class="search-suggestions">
            <ul>
              <li v-for="s in catalogSuggestions" :key="s.type+s.value" @mousedown.prevent="applyCatalogSuggestion(s)">
                <span class="suggest-text">{{ s.value }}</span>
                <span class="suggest-type">{{ s.type === 'title' ? 'Tiêu đề' : 'Tác giả' }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="form-group filters-genre">
          <label>Thể loại</label>
          <select v-model="filters.genre">
            <option value="">Tất cả thể loại</option>
            <option v-for="g in genres" :key="g" :value="g">
              {{ g }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <div v-if="error" class="card" style="margin-bottom: 1rem; color: #b91c1c">
      {{ error }}
    </div>

    <section class="home-section">
      <div class="home-books-grid">
        <BookCard
          v-for="book in filteredBooks"
          :key="book._id"
          :book="book"
          @borrow="openBorrowForm"
        />
      </div>
    </section>

    <!-- Borrow / Reserve form ẩn/hiện -->
    <div
      v-if="selectedBook"
      class="card"
      style="max-width: 480px; position: fixed; right: 1.5rem; bottom: 1.5rem; z-index: 30"
    >
      <h3>{{ selectedBook.quantity > 0 ? 'Mượn sách' : 'Đặt trước sách' }}</h3>
      <p style="font-size: 0.9rem; color: #4b5563">
        {{ selectedBook.title }} — {{ selectedBook.author }}
      </p>
      <p style="font-size: 0.85rem; color: #6b7280">
        Xác nhận {{ selectedBook.quantity > 0 ? 'mượn' : 'đặt trước' }} đầu sách này.
      </p>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: flex-end">
        <button class="btn btn-secondary" @click="closeBorrowForm">Hủy</button>
        <button class="btn btn-primary" :disabled="processing" @click="confirmBorrow">
          {{ processing ? 'Đang xử lý...' : 'Xác nhận' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import api from "../api";
import BookCard from "../components/BookCard.vue";

const books = ref([]);
const loading = ref(false);
const error = ref("");
const selectedBook = ref(null);
const processing = ref(false);

const filters = ref({
  q: "",
  genre: ""
});

const authors = computed(() => {
  const set = new Set(books.value.map((b) => b.author).filter(Boolean));
  return Array.from(set);
});

const genres = computed(() => {
  const set = new Set(books.value.map((b) => b.genre).filter(Boolean));
  return Array.from(set);
});

// catalog suggestions state
const catalogSuggestions = ref([]);
const catalogShowSuggestions = ref(false);
let catalogTimer = null;

const gatherCatalogSuggestions = () => {
  const q = filters.value.q.trim().toLowerCase();
  if (!q) { catalogSuggestions.value = []; return; }
  const titleMatches = books.value.map(b=>b.title).filter(Boolean).filter(t=>t.toLowerCase().includes(q));
  const authorMatches = books.value.map(b=>b.author).filter(Boolean).filter(a=>a.toLowerCase().includes(q));
  catalogSuggestions.value = [...Array.from(new Set(titleMatches)).slice(0,4).map(v=>({type:'title', value:v})), ...Array.from(new Set(authorMatches)).slice(0,4).map(v=>({type:'author', value:v}))].slice(0,6);
};

const onCatalogInput = () => {
  if (catalogTimer) clearTimeout(catalogTimer);
  catalogTimer = setTimeout(()=>{ gatherCatalogSuggestions(); catalogShowSuggestions.value = true; }, 250);
};

const applyCatalogSuggestion = (s) => {
  filters.value.q = s.value;
  catalogShowSuggestions.value = false;
};

const years = computed(() => {
  const set = new Set(books.value.map((b) => b.year).filter(Boolean));
  return Array.from(set).sort();
});

const filteredBooks = computed(() => {
  const searchTerm = filters.value.q.toLowerCase();
  return books.value.filter((b) => {
    const matchSearch = 
      !searchTerm ||
      b.title.toLowerCase().includes(searchTerm) ||
      (b.author && b.author.toLowerCase().includes(searchTerm));
    const matchGenre = !filters.value.genre || b.genre === filters.value.genre;
    return matchSearch && matchGenre;
  });
});

const fetchBooks = async () => {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/books");
    books.value = data;
  } catch (e) {
    error.value = "Failed to load books";
  } finally {
    loading.value = false;
  }
};

const borrow = async (bookId) => {
  error.value = "";
  try {
    await api.post("/borrow/borrow", { bookId });
    await fetchBooks();
    alert("Mượn sách thành công!");
  } catch (e) {
    error.value = e.response?.data?.message || "Không thể mượn sách";
  }
};

const openBorrowForm = (book) => {
  selectedBook.value = book;
};

const closeBorrowForm = () => {
  selectedBook.value = null;
  processing.value = false;
};

const confirmBorrow = async () => {
  if (!selectedBook.value) return;
  processing.value = true;
  await borrow(selectedBook.value._id);
  if (!error.value) {
    closeBorrowForm();
  } else {
    processing.value = false;
  }
};

onMounted(fetchBooks);
</script>

