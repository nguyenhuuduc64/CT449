// small auth helper for role checks
export function getUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

export default {
  getUser,
  isAuthenticated,
  isAdmin,
};
