# 🍽️ Indra's Pantry

A full-stack canteen ordering system with an admin web app and a user-facing web app, powered by Node.js + Express + Supabase.

---

## 🏗️ Project Structure

```
Indraapp/
├── backend/          # Node.js + Express + TypeScript API
├── admin-web/        # React + Vite admin dashboard (port 5173)
└── user-web/         # React + Vite user storefront (port 5174)
```

---

## ⚙️ Tech Stack

| Layer      | Stack                                              |
|------------|----------------------------------------------------|
| Backend    | Node.js 20, Express 4, TypeScript, Supabase (PostgreSQL) |
| Admin Web  | React 18, Vite 5, TypeScript, React Router v6     |
| User Web   | React 18, Vite 5, TypeScript, React Router v6     |
| Auth       | JWT (Bearer token, stored in `localStorage`)       |
| Images     | Multer (memory) → Supabase Storage                 |
| Styling    | CSS Modules + global CSS variables                 |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- A [Supabase](https://supabase.com) project (free tier works)
- npm or yarn

---

### 1. Database Setup (Supabase)

1. Go to your Supabase project → **SQL Editor**
2. Run the migration file:

```sql
-- Paste and run the contents of: backend/supabase/migrations/001_init.sql
```

3. In **Storage**, create a bucket named `canteen-hub` and set it to **Public**.

---

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
SUPABASE_STORAGE_BUCKET=canteen-hub
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

**Start the server:**

```bash
npm run dev        # Development (ts-node-dev)
npm run build      # Compile TypeScript
npm start          # Run compiled JS
```

**Seed sample data:**

```bash
npm run seed
```

This creates:
- **Admin:** `admin@canteenhub.com` / `admin123`
- **User:** `user@canteenhub.com` / `user123`
- 5 food categories + 19 menu items

---

### 3. Admin Web App

```bash
cd admin-web
npm install
npm run dev        # Starts on http://localhost:5173
```

Login with `admin@canteenhub.com` / `admin123`.

**Build for production:**

```bash
npm run build      # Output in dist/
```

---

### 4. User Web App

```bash
cd user-web
npm install
npm run dev        # Starts on http://localhost:5174
```

Login with `user@canteenhub.com` / `user123` or register a new account.

**Build for production:**

```bash
npm run build      # Output in dist/
```

---

## 🌐 API Overview

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint         | Description        | Auth     |
|--------|------------------|--------------------|----------|
| POST   | `/auth/register` | Register user      | Public   |
| POST   | `/auth/login`    | Login              | Public   |
| GET    | `/auth/me`       | Get current user   | Bearer   |

### Categories
| Method | Endpoint              | Description          | Auth        |
|--------|-----------------------|----------------------|-------------|
| GET    | `/categories`         | List active cats     | Bearer      |
| GET    | `/categories?all=true`| List all (incl inactive) | Admin  |
| POST   | `/categories`         | Create category      | Admin       |
| PUT    | `/categories/:id`     | Update category      | Admin       |
| DELETE | `/categories/:id`     | Delete category      | Admin       |

### Items
| Method | Endpoint         | Description                   | Auth   |
|--------|------------------|-------------------------------|--------|
| GET    | `/items`         | List items (`?search=`, `?category_id=`) | Bearer |
| GET    | `/items/:id`     | Get item by ID                | Bearer |
| POST   | `/items`         | Create item (multipart/form-data) | Admin |
| PUT    | `/items/:id`     | Update item                   | Admin  |
| DELETE | `/items/:id`     | Delete item                   | Admin  |

### Cart
| Method | Endpoint         | Description           | Auth  |
|--------|------------------|-----------------------|-------|
| GET    | `/cart`          | Get user cart         | User  |
| POST   | `/cart`          | Add/update cart item  | User  |
| PUT    | `/cart/:id`      | Update quantity       | User  |
| DELETE | `/cart/clear`    | Clear entire cart     | User  |
| DELETE | `/cart/:id`      | Remove item from cart | User  |

### Orders
| Method | Endpoint           | Description                | Auth  |
|--------|--------------------|----------------------------|-------|
| POST   | `/orders`          | Place order (from cart)    | User  |
| GET    | `/orders/my`       | Get my orders              | User  |
| GET    | `/orders/stats`    | Order statistics           | Admin |
| GET    | `/orders`          | Get all orders (`?status=`)| Admin |
| GET    | `/orders/:id`      | Get order by ID            | Both  |
| PATCH  | `/orders/:id/status`| Update order status       | Admin |

### Users
| Method | Endpoint             | Description           | Auth  |
|--------|----------------------|-----------------------|-------|
| GET    | `/users`             | List all users        | Admin |
| GET    | `/users/:id`         | Get user by ID        | Admin |
| PATCH  | `/users/:id/status`  | Activate/deactivate   | Admin |
| PUT    | `/users/profile`     | Update own profile    | User  |

---

## 📋 Order Status Flow

```
pending → accepted → preparing → ready → completed
                                       ↘ cancelled (any stage)
```

---

## 🔐 Environment Variables Reference

### Backend `.env`

| Variable                  | Description                              |
|---------------------------|------------------------------------------|
| `SUPABASE_URL`            | Your Supabase project URL                |
| `SUPABASE_SERVICE_ROLE_KEY`| Service-role key (bypasses RLS)         |
| `JWT_SECRET`              | Secret for signing JWT tokens            |
| `JWT_EXPIRES_IN`          | Token TTL (e.g. `7d`)                    |
| `SUPABASE_STORAGE_BUCKET` | Bucket name for item images (`canteen-hub`) |
| `CLIENT_URL`              | Frontend URL for CORS                    |
| `PORT`                    | Server port (default `5000`)             |

---

## 📁 Key Directory Layout

```
backend/
├── src/
│   ├── config/         # env.ts, supabase.ts
│   ├── controllers/    # auth, category, item, cart, order, user
│   ├── middleware/     # auth, roleCheck, upload
│   ├── routes/         # per-resource route files
│   ├── types/          # shared TypeScript interfaces
│   ├── utils/          # response helpers
│   └── server.ts       # Express app entry
├── supabase/migrations/ # 001_init.sql
└── seed/seed.ts

admin-web/src/
├── api/               # axiosInstance.ts, services.ts
├── components/        # Layout, Sidebar, ProtectedRoute
├── context/           # AuthContext
├── pages/             # Dashboard, CategoryManager, ItemManager, OrderManager, UserList, LoginPage
└── styles/global.css

user-web/src/
├── api/               # axiosInstance.ts, services.ts
├── components/        # Navbar, ProtectedRoute, ItemCard
├── context/           # AuthContext, CartContext
├── pages/             # HomePage, MenuPage, ItemDetailPage, CartPage, CheckoutPage, OrdersPage, OrderDetailPage, ProfilePage, LoginPage, RegisterPage
└── styles/global.css
```

---

## 🧪 Test Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@canteenhub.com     | admin123   |
| User  | user@canteenhub.com      | user123    |

---

## 📸 Feature Highlights

### Admin Web (port 5173)
- **Dashboard** — KPI cards (revenue, orders, items, users), status breakdown, recent orders
- **Category Manager** — Full CRUD with active/inactive toggle
- **Item Manager** — Card grid, image upload to Supabase Storage, search + filter
- **Order Manager** — Filter by status, update order status in one click
- **User Manager** — Search, activate/deactivate accounts

### User Web (port 5174)
- **Home** — Hero banner, category quick-nav, featured items, how-it-works
- **Menu** — Search + category filter, add-to-cart from grid
- **Item Detail** — Quantity selector, add N items to cart
- **Cart** — Quantity controls, remove items, live total
- **Checkout** — Review order, add notes, place order
- **Orders** — Full order history with status badges
- **Order Detail** — Live progress timeline, full item breakdown, bill
- **Profile** — Edit name/phone, quick links, sign out

---

## 🛡️ Security Notes

- All admin routes require `role === 'admin'` check via JWT payload
- Rate limiting: 200 requests / 15 minutes per IP
- Helmet sets secure HTTP headers
- File uploads restricted to JPEG/PNG/WebP, max 5 MB
- Passwords hashed with bcryptjs (salt rounds 12)
- RLS is disabled at the DB level; authorization enforced in Express middleware

---

## 🐞 Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Add your frontend URL to `CLIENT_URL` in backend `.env` |
| 401 on all requests | Check JWT_SECRET matches between token issue and verify |
| Images not loading | Ensure the `canteen-hub` storage bucket is **public** in Supabase |
| Seed fails | Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct |
| Port conflicts | Change `PORT` in backend `.env`; update `vite.config.ts` proxy target |
