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
            <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>
    </section>

    <div v-if="loading" class="card" style="margin-bottom: 1rem; text-align: center;">
      <div class="spinner"></div>
      <p>Đang tải sách...</p>
    </div>

    <div v-if="error" class="card" style="margin-bottom: 1rem; color: #b91c1c">{{ error }}</div>

    <div v-if="!loading && filteredBooks.length === 0" class="card" style="margin-bottom: 1rem; text-align: center;">
      <p style="color: #6b7280;">Không tìm thấy sách phù hợp với tiêu chí tìm kiếm.</p>
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

    <div v-if="selectedBook" class="modal-overlay" @click.self="closeBorrowForm">
      <div class="modal borrow-modal">
        <div class="modal-header">
          <h3>Gửi yêu cầu mượn sách</h3>
          <button class="modal-close" @click="closeBorrowForm"><span>&times;</span></button>
        </div>
        
        <div class="modal-content">
          <div class="book-info">
            <div class="book-cover-small">
              <img 
                v-if="selectedBook.coverImage" 
                :src="getBookCover(selectedBook)" 
                :alt="selectedBook.title"
              />
              <div v-else class="book-cover-placeholder">{{ getBookInitials(selectedBook.title) }}</div>
            </div>
            <div class="book-details">
              <h4>{{ selectedBook.title }}</h4>
              <p class="author">Tác giả: {{ selectedBook.author }}</p>
              <p class="status">Trạng thái: 
                <span :class="selectedBook.quantity > 0 ? 'available' : 'unavailable'">
                  {{ selectedBook.quantity > 0 ? 'Có sẵn' : 'Đã mượn hết' }}
                </span>
              </p>
              <p class="quantity" v-if="selectedBook.quantity > 0">Còn lại: <strong>{{ selectedBook.quantity }}</strong> cuốn</p>
            </div>
          </div>
          
          <div class="limit-info">
            <div class="limit-item">
              <span class="limit-label">Sách đang mượn:</span>
              <span class="limit-value">{{ activeBorrowsCount }} / 3 cuốn</span>
            </div>
            <div class="limit-progress">
              <div class="progress-bar" :style="{ width: borrowProgress }"></div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="form-group">
              <label>Ngày dự kiến trả</label>
              <div class="date-display">
                <span class="date-value">{{ formattedReturnDate }}</span>
                <span class="date-note">(Tự động tính toán)</span>
              </div>
              <p class="form-hint">Sách sẽ được mượn trong vòng 7 ngày kể từ ngày duyệt</p>
            </div>
            
            <div class="form-group">
              <label for="notes">Ghi chú (tùy chọn)</label>
              <textarea 
                id="notes"
                v-model="borrowRequest.notes" 
                rows="3" 
                placeholder="Ví dụ: Mượn cho mục đích nghiên cứu, làm luận văn..."
              ></textarea>
            </div>
            
            <div v-if="hasPendingRequest" class="warning-notice">
              <p>Bạn đã có yêu cầu mượn sách này đang chờ duyệt.</p>
            </div>
            
            <div v-else-if="hasReachedBorrowLimit" class="warning-notice limit-warning">
              <p>Bạn đã mượn tối đa 3 cuốn sách. Vui lòng trả sách trước khi mượn thêm.</p>
            </div>
            
            <div v-else-if="selectedBook.quantity === 0" class="warning-notice">
              <p>Sách hiện đã được mượn hết. Yêu cầu của bạn sẽ được xếp vào danh sách chờ.</p>
            </div>
            
            <div class="request-info">
              <p>Yêu cầu của bạn sẽ được gửi đến quản trị viên để xét duyệt. Sách sẽ được mượn trong vòng 7 ngày.</p>
            </div>
            
            <div class="form-actions">
              <button class="btn btn-secondary" @click="closeBorrowForm" :disabled="processing">Hủy</button>
              <button 
                class="btn btn-primary" 
                @click="submitBorrowRequest" 
                :disabled="processing || hasPendingRequest || selectedBook.quantity === 0 || hasReachedBorrowLimit"
              >
                <span v-if="processing"><span class="small-spinner"></span> Đang gửi...</span>
                <span v-else>Gửi yêu cầu</span>
              </button>
            </div>
            
            <div v-if="requestError" class="error-message">{{ requestError }}</div>
            
            <div v-if="requestSuccess" class="success-message">
              <p>{{ requestSuccess }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import api from "../api";
import BookCard from "../components/BookCard.vue";

const books = ref([]);
const loading = ref(false);
const error = ref("");
const selectedBook = ref(null);
const processing = ref(false);
const requestError = ref("");
const requestSuccess = ref("");
const userBorrows = ref([]);

const borrowRequest = ref({
  expectedReturnDate: "",
  notes: ""
});

const filters = ref({
  q: "",
  genre: ""
});

const activeBorrowsCount = computed(() => {
  return userBorrows.value.filter(borrow => 
    borrow.status === 'approval' || borrow.status === 'borrowed'
  ).length;
});

const hasReachedBorrowLimit = computed(() => {
  return activeBorrowsCount.value >= 3;
});

const borrowProgress = computed(() => {
  return `${(activeBorrowsCount.value / 3) * 100}%`;
});

const getFixedReturnDate = () => {
  const today = new Date();
  const returnDate = new Date(today);
  returnDate.setDate(returnDate.getDate() + 7);
  return returnDate.toISOString().split('T')[0];
};

const formattedReturnDate = computed(() => {
  const returnDate = new Date(getFixedReturnDate());
  return returnDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

const hasPendingRequest = computed(() => {
  if (!selectedBook.value || userBorrows.value.length === 0) return false;
  return userBorrows.value.some(borrow => 
    borrow.book?._id === selectedBook.value._id && 
    (borrow.status === 'approval' || borrow.status === 'borrowed')
  );
});

const genres = computed(() => {
  const set = new Set(books.value.map((b) => b.genre).filter(Boolean));
  return Array.from(set);
});

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
    error.value = "Không thể tải danh sách sách";
  } finally {
    loading.value = false;
  }
};

const fetchUserBorrows = async () => {
  try {
    const { data } = await api.get("/borrow/me");
    userBorrows.value = data;
  } catch (e) {}
};

const getBookCover = (book) => {
  if (!book.coverImage) return '';
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const API_ORIGIN = API_BASE.replace(/\/api\/?$/i, "");
  const src = book.coverImage;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith('/')) return `${API_ORIGIN}${src}`;
  return `${API_ORIGIN}/${src}`;
};

const getBookInitials = (title) => {
  const parts = title.split(" ");
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const openBorrowForm = (book) => {
  selectedBook.value = book;
  requestError.value = "";
  requestSuccess.value = "";
  borrowRequest.value = {
    expectedReturnDate: getFixedReturnDate(),
    notes: ""
  };
  document.body.style.overflow = 'hidden';
};

const closeBorrowForm = () => {
  selectedBook.value = null;
  processing.value = false;
  requestError.value = "";
  requestSuccess.value = "";
  borrowRequest.value = { expectedReturnDate: "", notes: "" };
  document.body.style.overflow = '';
};

const handleKeydown = (event) => {
  if (event.key === 'Escape' && selectedBook.value) {
    closeBorrowForm();
  }
};

const submitBorrowRequest = async () => {
  if (!selectedBook.value) return;
  
  if (hasReachedBorrowLimit.value) {
    requestError.value = "Bạn đã mượn tối đa 3 cuốn sách.";
    return;
  }
  
  if (hasPendingRequest.value) {
    requestError.value = "Bạn đã có yêu cầu mượn sách này đang chờ duyệt";
    return;
  }
  
  borrowRequest.value.expectedReturnDate = getFixedReturnDate();
  processing.value = true;
  requestError.value = "";
  requestSuccess.value = "";
  
  try {
    const response = await api.post("/borrow/borrow", {
      bookId: selectedBook.value._id,
      expectedReturnDate: borrowRequest.value.expectedReturnDate,
      notes: borrowRequest.value.notes || undefined
    });
    
    requestSuccess.value = `Yêu cầu mượn sách "${selectedBook.value.title}" đã được gửi thành công!`;
    
    await Promise.all([fetchBooks(), fetchUserBorrows()]);
    
    setTimeout(() => { closeBorrowForm(); }, 3000);
    
  } catch (err) {
    if (err.response?.status === 400) {
      requestError.value = err.response.data.message || "Dữ liệu không hợp lệ";
    } else if (err.response?.status === 401) {
      requestError.value = "Vui lòng đăng nhập để gửi yêu cầu mượn sách";
    } else if (err.response?.status === 403) {
      requestError.value = "Bạn không có quyền gửi yêu cầu mượn sách";
    } else if (err.response?.status === 409) {
      requestError.value = "Bạn đã có yêu cầu mượn sách này đang chờ duyệt";
    } else if (err.response?.status === 429) {
      requestError.value = "Bạn đã mượn tối đa số sách cho phép";
    } else if (err.message === 'Network Error') {
      requestError.value = "Không thể kết nối đến máy chủ.";
    } else {
      requestError.value = "Không thể gửi yêu cầu mượn sách.";
    }
    processing.value = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  fetchBooks();
  fetchUserBorrows();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.home-section-header {
  margin-bottom: 1rem;
}

.home-section-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #1f2937;
  font-weight: 600;
}

.home-section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.grid.filters-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-suggestions {
  position: absolute;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  z-index: 100;
  margin-top: 0.25rem;
}

.search-suggestions ul {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}

.search-suggestions li {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-suggestions li:hover {
  background-color: #f9fafb;
}

.suggest-text {
  font-weight: 500;
  font-size: 0.875rem;
}

.suggest-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.home-section {
  margin-top: 0.75rem;
}

.home-books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.borrow-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.125rem;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-content {
  padding: 1.25rem;
}

.book-info {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 1.25rem;
}

.book-cover-small {
  width: 70px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.book-cover-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.book-details {
  flex: 1;
}

.book-details h4 {
  margin: 0 0 0.375rem 0;
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.3;
  font-weight: 600;
}

.book-details .author {
  margin: 0 0 0.375rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.book-details .status {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.book-details .quantity {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.status .available {
  color: #10b981;
  font-weight: 500;
}

.status .unavailable {
  color: #dc2626;
  font-weight: 500;
}

.limit-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.limit-label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.limit-value {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
}

.limit-progress {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4d50ff 0%, #4d50ff 100%);
  transition: width 0.3s ease;
}

.form-section {
  margin-top: 0.75rem;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 0.25rem;
}

.date-value {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.date-note {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.form-hint {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.warning-notice {
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  margin: 0.75rem 0;
}

.warning-notice p {
  margin: 0;
  color: #92400e;
  font-size: 0.875rem;
  line-height: 1.4;
}

.limit-warning {
  background: #fef2f2;
  border-color: #fecaca;
}

.limit-warning p {
  color: #dc2626;
}

.request-info {
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  margin: 0.75rem 0;
}

.request-info p {
  margin: 0;
  color: #1e40af;
  font-size: 0.875rem;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.small-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 0.375rem;
}

.error-message {
  margin-top: 0.75rem;
  padding: 0.625rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.875rem;
}

.success-message {
  margin-top: 0.75rem;
  padding: 0.625rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  font-size: 0.875rem;
}

.success-message p {
  margin: 0;
}

@media (max-width: 768px) {
  .grid.filters-row {
    grid-template-columns: 1fr;
  }
  
  .home-books-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .borrow-modal {
    width: 95%;
    max-height: 85vh;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1rem 1rem 0.75rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .book-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .home {
    padding: 0.5rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .borrow-modal {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    margin: 0;
  }
  
  .modal-content {
    padding: 0.75rem;
  }
}
</style>