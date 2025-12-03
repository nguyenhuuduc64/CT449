<template>
  <div class="card borrow-history">
    <h2>My borrowing history</h2>
    <p class="description">
      Track all books you have borrowed, due dates, and any late fees.
    </p>
    <p v-if="error" class="error" style="color: #b91c1c">{{ error }}</p>
    <div v-if="borrows.length" class="borrow-table-wrapper">
      <table class="table borrow-table">
      <thead>
        <tr>
          <th>Book</th>
          <th>Borrowed</th>
          <th>Due</th>
          <th>Status</th>
          <th>Late Fee</th>
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
              {{ b.status }}
            </span>
          </td>
          <td>{{ formatMoney(b.lateFee) }}</td>
        </tr>
      </tbody>
      </table>
    </div>
    <p v-else class="borrow-empty">No borrowing records yet.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const borrows = ref([]);
const error = ref('');

const loadBorrows = async () => {
  error.value = '';
  try {
    const { data } = await api.get('/borrow/me');
    borrows.value = data;
  } catch (e) {
    error.value = 'Failed to load borrowing history';
  }
};

const formatDate = (val) => {
  if (!val) return '-';
  return new Date(val).toLocaleDateString();
};

const formatMoney = (v) => {
  if (v == null || v === 0) return '-';
  try {
    return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
  } catch (e) {
    return v;
  }
};

onMounted(loadBorrows);
</script>


