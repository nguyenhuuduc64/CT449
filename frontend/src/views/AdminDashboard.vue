<template>
  <div class="home">
    <div class="card" style="margin-bottom: 1rem">
      <div class="home-section-header">
        <h3>Bảng điều khiển quản trị</h3>
        <p>Tổng quan nhanh về hệ thống thư viện và các chức năng quản lý.</p>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab-button', { 'active': activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div
        class="grid"
        style="
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-top: 0.75rem;
        "
      >
        <div class="card" style="padding: 0.75rem 0.9rem">
          <p
            style="
              font-size: 0.75rem;
              text-transform: uppercase;
              color: #9ca3af;
              margin: 0 0 0.25rem;
            "
          >
            Tổng số sách
          </p>
          <p style="margin: 0; font-size: 1.3rem; font-weight: 600">
            {{ books.length }}
          </p>
        </div>
        <div class="card" style="padding: 0.75rem 0.9rem">
          <p
            style="
              font-size: 0.75rem;
              text-transform: uppercase;
              color: #9ca3af;
              margin: 0 0 0.25rem;
            "
          >
            Sách được mượn nhiều nhất
          </p>
          <p style="margin: 0; font-size: 0.9rem">
            {{ topBorrowedBook?.title || "Chưa có dữ liệu" }}
          </p>
        </div>
      </div>
      
    </div>

    <!-- Tab: Books -->
    <div v-if="activeTab === 'books'" class="admin-grid">
      <div class="card">
        <h2>Quản lý sách</h2>
        <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #6b7280">
          Thêm mới hoặc chỉnh sửa thông tin sách trong thư viện.
        </p>
        <button
          class="btn btn-primary"
          style="margin-bottom: 0.75rem"
          @click="openBookFormModal"
        >
          Thêm sách mới
        </button>
      </div>

      <div class="card">
        <h2>Danh sách sách</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Tồn kho</th>
              <th>Đã mượn</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in pagedBooks" :key="b._id">
              <td>{{ b.title }}</td>
              <td>{{ b.author }}</td>
              <td>{{ b.quantity }}</td>
              <td>{{ b.borrowedCount }}</td>
              <td>
                <button class="btn btn-secondary" @click="editBook(b)">
                  Sửa
                </button>
                <button
                  class="btn btn-primary"
                  style="margin-left: 0.25rem; background: #dc2626"
                  @click="removeBook(b._id)"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="totalPages > 1"
          style="
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
            font-size: 0.85rem;
          "
        >
          <button
            class="btn btn-secondary"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Trước
          </button>
          <span>Trang {{ currentPage }} / {{ totalPages }}</span>
          <button
            class="btn btn-secondary"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Sau
          </button>
        </div>
      </div>
    </div>

    <!-- Users tab removed per request -->

    <!-- Tab: Borrows -->
    <div v-if="activeTab === 'borrows'" class="card">
      <h2>Quản lý mượn / trả sách</h2>
      <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #6b7280">
        Theo dõi tình trạng mượn, trả và tiền phạt trễ hạn. Admin có thể thay
        đổi trạng thái mượn/ trả của từng bản ghi.
      </p>

      <div style="margin-top: 1rem">
        <!-- Filters -->
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap">
          <input v-model="borrowQuery" placeholder="Tìm theo tên người mượn hoặc tên sách" style="padding:0.45rem 0.6rem; border:1px solid #d1d5db;" />
          <select v-model="borrowStatusFilter" style="padding:0.45rem 0.6rem; border:1px solid #d1d5db;">
            <option value="">Tất cả trạng thái</option>
            <option value="approval">Chờ duyệt</option>
            <option value="borrowed">Đang mượn</option>
            <option value="returned">Đã trả</option>
            <option value="overdue">Quá hạn</option>
        </select>
          <button class="btn btn-secondary" @click="clearBorrowFilters">Xóa bộ lọc</button>
        </div>

        <!-- Thêm trong phần bảng quản lý mượn trả -->
<table class="table admin-borrows-table">
  <thead>
    <tr>
      <th>Người mượn</th>
      <th>Sách</th>
      <th>Ngày yêu cầu</th>
      <th>Hạn trả dự kiến</th>
      <th>Trạng thái</th>
      <th>Ghi chú</th>
      <th>Hành động</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="b in filteredBorrows" :key="b._id">
      <td>{{ b.user?.name }}<div style="font-size:0.8rem;color:#6b7280">{{ b.user?.email }}</div></td>
      <td style="max-width:260px">{{ b.book?.title }}</td>
      <td>{{ formatDate(b.createdAt) }}</td>
      <td>{{ formatDate(b.dueDate) }}</td>
      <td>
        <span class="badge" :class="{
          'badge-success': b.status === 'returned',
          'badge-warning': b.status === 'borrowed',
          'badge-danger': b.status === 'overdue',
          'badge-info': b.status === 'approval'
        }">{{ getStatusText(b.status) }}</span>
      </td>
      <td>{{ b.notes || '-' }}</td>
      <td style="white-space:nowrap">
        <template v-if="b.status === 'approval'">
          <button 
            class="btn btn-success" 
            @click="approveBorrow(b)"
            style="background: #16a34a; margin-right: 0.25rem;"
          >
            Duyệt
          </button>
          <button 
            class="btn btn-danger" 
            @click="rejectBorrow(b)"
            style="background: #dc2626;"
          >
            Từ chối
          </button>
        </template>
        <button 
          v-else 
          class="btn btn-primary" 
          @click="openEditBorrowModal(b)"
        >
          Chỉnh sửa
        </button>
      </td>
    </tr>
  </tbody>
</table>
      </div>

      <!-- Edit Borrow Modal -->
      <div v-if="editBorrowModalVisible" class="modal-overlay" @click.self="closeEditBorrowModal">
        <div class="modal">
          <h3>Chỉnh trạng thái mượn</h3>
          <p style="color:#6b7280; margin-bottom:0.5rem">Người mượn: <strong>{{ editingBorrow.user?.name }}</strong></p>
          <p style="color:#6b7280; margin-bottom:1rem">Sách: <strong>{{ editingBorrow.book?.title }}</strong></p>
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="editingBorrow._newStatus">
              <option value="approval">Chờ duyệt</option>
              <option value="borrowed">Đang mượn</option>
              <option value="returned">Đã trả</option>
              <option value="overdue">Quá hạn</option>
            </select>
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:0.75rem">
            <button class="btn btn-secondary" @click="closeEditBorrowModal">Hủy</button>
            <button class="btn btn-primary" @click="saveBorrowStatusFromModal">Lưu</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories tab removed per request -->

    <!-- Tab: Stats -->
    <div v-if="activeTab === 'stats'" class="card">
      <h2>Thống kê & báo cáo</h2>
      <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #6b7280">
        Thống kê nhanh dựa trên dữ liệu sách hiện tại.
      </p>
      <ul style="font-size: 0.9rem; padding-left: 1.1rem">
        <li>
          Số đầu sách: <strong>{{ books.length }}</strong>
        </li>
        <li>
          Sách được mượn nhiều nhất:
          <strong>{{ topBorrowedBook?.title || "Chưa có dữ liệu" }}</strong>
        </li>
      </ul>
    </div>

    <!-- Book Form Modal -->
    <div v-if="showBookFormModal" class="modal-overlay" @click.self="closeBookFormModal">
      <div class="modal">
        <h3>{{ bookForm._id ? "Chỉnh sửa sách" : "Thêm sách mới" }}</h3>
        <p style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #6b7280">
          {{ bookForm._id ? "Cập nhật thông tin sách trong thư viện." : "Thêm sách mới vào thư viện." }}
        </p>
        
        <form @submit.prevent="saveBook">
          <div class="form-group">
            <label>Tiêu đề</label>
            <input v-model="bookForm.title" required />
          </div>
          <div class="form-group">
            <label>Tác giả</label>
            <input v-model="bookForm.author" required />
          </div>
          <div class="form-group">
            <label>Thể loại</label>
            <input v-model="bookForm.genre" />
          </div>
          <div class="form-group">
            <label>Năm xuất bản</label>
            <input v-model.number="bookForm.year" type="number" />
          </div>
          <div class="form-group">
            <label>Số lượng</label>
            <input v-model.number="bookForm.quantity" type="number" min="0" />
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="bookForm.description" rows="3" />
          </div>
          <div class="form-group">
            <label>Ảnh bìa (từ máy tính)</label>
            <input type="file" accept="image/*" @change="onCoverSelected" />
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem">
            <button type="button" class="btn btn-secondary" @click="closeBookFormModal">
              Hủy
            </button>
            <button class="btn btn-primary" :disabled="savingBook">
              {{ bookForm._id ? "Cập nhật sách" : "Thêm sách" }}
            </button>
          </div>
          <p v-if="bookError" style="color: #b91c1c; margin-top: 0.5rem">
            {{ bookError }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import api from "../api";
import BorrowStatsChart from '../components/BorrowStatsChart.vue';

const tabs = [
  { id: 'dashboard', label: 'Tổng quan' },
  { id: 'books', label: 'Quản lý sách' },
  { id: 'borrows', label: 'Quản lý mượn trả' },
  { id: 'stats', label: 'Thống kê' }
];

const activeTab = ref("dashboard");
const statsPeriod = ref('week');
const categoryStats = ref({
  labels: [],
  datasets: [
    {
      label: 'Số lượt mượn',
      backgroundColor: '#4f46e5',
      data: []
    }
  ]
});

const books = ref([]);
const savingBook = ref(false);
const bookError = ref("");
const showBookFormModal = ref(false);
const coverFile = ref(null);
const currentPage = ref(1);
const pageSize = 10;

const bookForm = ref({
  _id: "",
  title: "",
  author: "",
  genre: "",
  year: null,
  quantity: 1,
  description: "",
  coverImage: "",
});

const loadBooks = async () => {
  try {
    const { data } = await api.get("/books");
    books.value = data;
    currentPage.value = 1;
  } catch (e) {
    // ignore for admin panel
  }
};

const openBookFormModal = () => {
  resetBookForm();
  showBookFormModal.value = true;
};

const closeBookFormModal = () => {
  showBookFormModal.value = false;
  resetBookForm();
};

const resetBookForm = () => {
  bookForm.value = {
    _id: "",
    title: "",
    author: "",
    genre: "",
    year: null,
    quantity: 1,
    description: "",
    coverImage: "",
  };
  bookError.value = "";
  coverFile.value = null;
};

const onCoverSelected = (event) => {
  const [file] = event.target.files;
  coverFile.value = file || null;
};

const saveBook = async () => {
  savingBook.value = true;
  bookError.value = "";
  try {
    const formData = new FormData();
    formData.append("title", bookForm.value.title);
    formData.append("author", bookForm.value.author);
    formData.append("genre", bookForm.value.genre || "");
    if (bookForm.value.year) formData.append("year", bookForm.value.year);
    formData.append("quantity", bookForm.value.quantity);
    formData.append("description", bookForm.value.description || "");
    if (coverFile.value) {
      formData.append("cover", coverFile.value);
    }

    if (bookForm.value._id) {
      await api.put(`/books/${bookForm.value._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      await api.post("/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    closeBookFormModal();
    await loadBooks();
  } catch (e) {
    bookError.value = e.response?.data?.message || "Failed to save book";
  } finally {
    savingBook.value = false;
  }
};

const editBook = (b) => {
  bookForm.value = { ...b };
  showBookFormModal.value = true;
};

const removeBook = async (id) => {
  if (!confirm("Delete this book?")) return;
  try {
    await api.delete(`/books/${id}`);
    await loadBooks();
  } catch (e) {
    alert("Failed to delete book");
  }
};

const topBorrowedBook = computed(() => {
  if (!books.value.length) return null;
  return [...books.value].sort(
    (a, b) => (b.borrowedCount || 0) - (a.borrowedCount || 0)
  )[0];
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(books.value.length / pageSize))
);

const pagedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return books.value.slice(start, start + pageSize);
});

const borrowsAdmin = ref([]);
const borrowQuery = ref('');
const borrowStatusFilter = ref('');
const editBorrowModalVisible = ref(false);
const editingBorrow = ref({});

const loadAdminBorrows = async () => {
  try {
    const { data } = await api.get('/borrow');
    // attach a mutable _newStatus field for the select control
    borrowsAdmin.value = data.map(d => ({ ...d, _newStatus: d.status }));
  } catch (e) {
    console.error('Failed to load admin borrows', e);
  }
};

const filteredBorrows = computed(() => {
  const q = borrowQuery.value.trim().toLowerCase();
  return borrowsAdmin.value.filter(b => {
    if (borrowStatusFilter.value && b.status !== borrowStatusFilter.value) return false;
    if (!q) return true;
    const user = (b.user?.name || '').toLowerCase();
    const email = (b.user?.email || '').toLowerCase();
    const book = (b.book?.title || '').toLowerCase();
    return user.includes(q) || email.includes(q) || book.includes(q);
  });
});

const clearBorrowFilters = () => {
  borrowQuery.value = '';
  borrowStatusFilter.value = '';
};

const openEditBorrowModal = (b) => {
  editingBorrow.value = { ...b, _newStatus: b._newStatus || b.status };
  editBorrowModalVisible.value = true;
};

const closeEditBorrowModal = () => {
  editBorrowModalVisible.value = false;
  editingBorrow.value = {};
};

const saveBorrowStatusFromModal = async () => {
  try {
    const { data } = await api.put(`/borrow/${editingBorrow.value._id}/status`, { status: editingBorrow.value._newStatus });
    // update local copy
    const idx = borrowsAdmin.value.findIndex(x => x._id === data._id);
    if (idx !== -1) borrowsAdmin.value.splice(idx, 1, { ...data, _newStatus: data.status });
    closeEditBorrowModal();
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to update borrow status');
  }
};

const updateBorrowStatus = async (borrow) => {
  try {
    const { data } = await api.put(`/borrow/${borrow._id}/status`, { status: borrow._newStatus });
    // update local row
    const idx = borrowsAdmin.value.findIndex(x => x._id === data._id);
    if (idx !== -1) borrowsAdmin.value.splice(idx, 1, { ...data, _newStatus: data.status });
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to update borrow status');
  }
};

const loadStats = async () => {
  try {
    // This is a mock data - in a real app, you would fetch this from your API
    const { data } = await api.get('/borrows/stats', { 
      params: { period: statsPeriod.value } 
    });
    
    // Update chart data
    categoryStats.value = {
      labels: data.labels,
      datasets: [{
        label: 'Số lượt mượn',
        backgroundColor: '#4f46e5',
        data: data.data
      }]
    };
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const formatDate = (val) => {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString();
  } catch (e) {
    return '-';
  }
};



// Thêm hàm duyệt yêu cầu mượn sách


// Thêm hàm từ chối yêu cầu mượn sách

// Thêm các hàm xử lý
const getStatusText = (status) => {
  const statusMap = {
    'approval': 'Chờ duyệt',
    'borrowed': 'Đang mượn',
    'returned': 'Đã trả',
    'overdue': 'Quá hạn'
  };
  return statusMap[status] || status;
};

// Hàm duyệt yêu cầu mượn
const approveBorrow = async (borrow) => {
  if (!confirm(`Duyệt yêu cầu mượn sách "${borrow.book?.title}" cho ${borrow.user?.name}?`)) return;
  
  try {
    // Kiểm tra số lượng sách còn lại
    const bookResponse = await api.get(`/books/${borrow.book._id}`);
    const book = bookResponse.data;
    
    if (book.quantity <= 0) {
      alert('Sách này đã hết trong kho. Không thể duyệt yêu cầu mượn.');
      return;
    }
    
    // Gọi API duyệt yêu cầu
    const { data } = await api.put(`/borrow/${borrow._id}/approve`);
    
    // Cập nhật local state
    const idx = borrowsAdmin.value.findIndex(x => x._id === data._id);
    if (idx !== -1) {
      borrowsAdmin.value.splice(idx, 1, { 
        ...data, 
        _newStatus: data.status,
        book: { ...borrow.book, quantity: book.quantity - 1 }
      });
    }
    
    alert('✅ Đã duyệt yêu cầu mượn sách thành công!');
  } catch (e) {
    console.error('Error approving borrow:', e);
    alert(e.response?.data?.message || 'Không thể duyệt yêu cầu mượn sách');
  }
};

// Hàm từ chối yêu cầu mượn
const rejectBorrow = async (borrow) => {
  const reason = prompt(`Nhập lý do từ chối yêu cầu mượn sách "${borrow.book?.title}" của ${borrow.user?.name}:`, '');
  if (reason === null) return; // Người dùng nhấn Cancel
  
  try {
    // Gọi API từ chối yêu cầu
    await api.put(`/borrow/${borrow._id}/reject`, { reason });
    
    // Cập nhật local state (chuyển sang trạng thái khác hoặc xóa)
    const idx = borrowsAdmin.value.findIndex(x => x._id === borrow._id);
    if (idx !== -1) {
      // Bạn có thể chọn xóa khỏi danh sách hoặc đánh dấu là bị từ chối
      borrowsAdmin.value.splice(idx, 1);
    }
    
    alert('✅ Đã từ chối yêu cầu mượn sách');
  } catch (e) {
    console.error('Error rejecting borrow:', e);
    alert(e.response?.data?.message || 'Không thể từ chối yêu cầu mượn sách');
  }
};
onMounted(() => {
  loadBooks();
  loadStats();
  loadAdminBorrows();
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f3f4f6;
}

.tab-button.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.recent-activity {
  margin-top: 1rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  color: #6b7280;
  font-size: 0.875rem;
}

.category-list {
  margin-top: 1rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.book-stats {
  margin-top: 1rem;
}

.book-stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.book-title {
  flex: 1;
}

.book-borrow-count {
  font-weight: 600;
  color: #4f46e5;
}

.text-green-600 {
  color: #16a34a;
}

.text-blue-600 {
  color: #2563eb;
}

.text-red-600 {
  color: #dc2626;
}

.mt-6 {
  margin-top: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

/* Modal Overlay Styles */
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
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
}

/* Thêm style cho badge-info */
.badge-info {
  background: #0ea5e9;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Cập nhật các badge khác nếu cần */
.badge-success { background: #16a34a; }
.badge-warning { background: #ca8a04; }
.badge-danger { background: #dc2626; }
</style>