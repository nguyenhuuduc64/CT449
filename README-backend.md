## Library Borrowing Management System – Backend

This is a simple Node.js + Express + MongoDB backend starter for the Library Borrowing Management System.

### 1. Install dependencies

```bash
cd D:\Study\CT449
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
MONGO_URI=mongodb://localhost:27017/library_db
PORT=5000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

Make sure MongoDB is running locally or change `MONGO_URI` to point to your MongoDB instance.

### 3. Run the server

Development (with nodemon):

```bash
npm run dev
```

Production:

```bash
npm start
```

The API will be available at `http://localhost:5000/`.

### 4. Main endpoints

- `POST /api/auth/register` – register member
- `POST /api/auth/login` – login (returns JWT)

- `GET /api/books` – list/search books (public)
- `GET /api/books/:id` – book details (public)
- `POST /api/books` – create book (admin)
- `PUT /api/books/:id` – update book (admin)
- `DELETE /api/books/:id` – delete book (admin)

- `GET /api/users/me` – current user profile
- `PUT /api/users/me` – update current user profile
- `GET /api/users` – list users (admin)
- `PUT /api/users/:id` – update user (admin)
- `DELETE /api/users/:id` – delete user (admin)
- `GET /api/users/:id/borrows` – user borrowing history (admin)

- `POST /api/borrow/borrow` – borrow a book (member)
- `POST /api/borrow/return` – return a book (member)
- `POST /api/borrow/renew` – renew a borrowed book (member)
- `GET /api/borrow/me` – current user’s borrows

Use the `Authorization: Bearer <token>` header for protected routes after login.


