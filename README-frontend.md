## Library Borrowing Management System – Frontend (Vue 3 + Vite)

This is a minimal Vue 3 SPA that connects to the existing Node/Express backend.

### 1. Install dependencies

From the project root:

```bash
cd frontend
npm install
```

### 2. Run the frontend

First, make sure the backend is running on `http://localhost:5000`:

```bash
npm run dev        # in project root, for backend (if you kept scripts there)
```

Then, in another terminal, run the frontend:

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173/`.

### 3. What’s included

- Pages:
  - `BookCatalog` – browse/search books and borrow.
  - `Login` / `Register` – authentication.
  - `UserProfile` – view/update basic profile.
  - `BorrowHistory` – see borrowing history and late fees.
  - `AdminDashboard` – simple book management (admin only).
- Auth is handled via JWT token stored in `localStorage` and attached via Axios interceptor.


