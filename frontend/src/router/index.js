import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import BookCatalog from "../views/BookCatalog.vue";
import BookDetail from "../views/BookDetail.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import UserProfile from "../views/UserProfile.vue";
import BorrowHistory from "../views/BorrowHistory.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import { isAuthenticated, isAdmin } from "../utils/auth";

const routes = [
  { path: "/", name: "home", component: Home },
  { path: "/catalog", name: "catalog", component: BookCatalog },
  { path: "/books/:id", name: "book-detail", component: BookDetail },
  { path: "/login", name: "login", component: Login },
  { path: "/register", name: "register", component: Register },
  {
    path: "/profile",
    name: "profile",
    component: UserProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/borrows",
    name: "borrows",
    component: BorrowHistory,
    meta: { requiresAuth: true },
  },
  // Redirect to home for any unknown routes
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Add admin route dynamically only for admin users so navigation/tab is removed for members
if (isAdmin()) {
  router.addRoute({
    path: "/admin",
    name: "admin",
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  });
}

// Navigation guard
router.beforeEach((to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }

    if (to.matched.some((record) => record.meta.requiresAdmin)) {
      if (!isAdmin()) {
        next({ name: "home" });
        return;
      }
    }
  }

  next(); // Proceed to the route
});

export default router;
