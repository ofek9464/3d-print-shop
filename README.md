# 🧊 3D Print Shop — E-Commerce Website

Premium e-commerce website for marketing and selling 3D printed models. Customers can browse a catalog, rotate 3D models, change colors, select materials, and add items to cart.

---

## 🚀 Features

- **Product Catalog** with category filtering (Toys, Tools, Home Decor, Gaming, Mechanical Parts, Art & Sculptures)
- **Interactive 3D Viewer** — rotate, zoom, and inspect models (Three.js)
- **Color Picker** — 12 colors, live preview on 3D model
- **Material Selection** — PLA, PLA+, Matt PLA, PETG, ABS, TPU with dynamic pricing
- **Custom Print Requests** — upload STL/OBJ files, get instant price estimates
- **Shopping Cart** with localStorage persistence
- **Admin Panel** — edit product prices, material multipliers, change password
- **Responsive Design** — works on desktop, tablet, and mobile

---

## 📁 Project Structure

```
3d_selling website/
├── index.html          # Main storefront
├── admin.html          # Admin panel (login + dashboard)
├── README.md           # This file
├── css/
│   └── styles.css      # Complete design system
└── js/
    ├── products.js     # Product data, materials, pricing helpers
    ├── viewer.js       # Three.js 3D model viewer & shape generators
    ├── cart.js          # Shopping cart manager (localStorage)
    ├── custom-order.js  # Custom print upload & price estimator
    ├── app.js           # Main application controller
    └── admin.js         # Admin panel authentication & management
```

---

## 🔧 How to Run

Simply open `index.html` in a browser. No build step required.

For local development with live reload, you can use any static file server:

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: VS Code Live Server extension
```

---

## 🔐 Admin Panel

Access: [admin.html](admin.html)

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

The admin panel lets you:
- Edit base prices for all products
- Adjust material pricing multipliers
- Set custom order rates (per cm³ + setup fee)
- Change admin password

---

## ⚠️ SECURITY — BEFORE GOING TO PRODUCTION

> [!CAUTION]
> **CRITICAL: The items below MUST be addressed before deploying to production.**

### 🔴 Remove / Replace Hardcoded Admin Credentials

The file `js/admin.js` contains a **hardcoded SHA-256 hash** of the default admin password (`admin123`). This is for development only.

**Before production you MUST:**
1. **Remove the `DEFAULT_CREDENTIALS` object** from `js/admin.js` (line ~10)
2. **Replace client-side auth entirely** with a proper server-side authentication system
3. **Never ship password hashes in frontend JavaScript** — they are visible to anyone

### 🔴 Implement Server-Side Authentication

Replace the current client-side auth with:
- [ ] **Backend API** (Node.js/Express, Python/Flask, etc.)
- [ ] **bcrypt password hashing** (not SHA-256) with salt
- [ ] **JWT tokens** stored in HTTP-only, Secure, SameSite cookies
- [ ] **Session expiry** and refresh token rotation
- [ ] **Rate limiting** on login endpoints (e.g., 5 attempts per minute)
- [ ] **CSRF protection** on all state-changing requests

### 🔴 Payment Integration

- [ ] Integrate **Stripe** for payment processing (never handle raw card data)
- [ ] Use **Stripe Checkout** or **Stripe Elements** on the frontend
- [ ] Create a backend endpoint for payment intent creation
- [ ] Set up webhook handlers for payment confirmation
- [ ] Add support for Apple Pay / Google Pay via Stripe

### 🔴 HTTPS & Infrastructure

- [ ] Deploy with **HTTPS** (SSL/TLS certificate — free via Let's Encrypt or Cloudflare)
- [ ] Set up **Content Security Policy (CSP)** headers
- [ ] Enable **HSTS** (HTTP Strict Transport Security)
- [ ] Add **input validation & sanitization** on both frontend and backend

### 🟡 Database

- [ ] Move product data from `js/products.js` to a **database** (PostgreSQL, MongoDB, etc.)
- [ ] Move admin price overrides from `localStorage` to the database
- [ ] Move cart data to server-side sessions for logged-in users

### 🟡 Additional Features (Future)

- [ ] User accounts & order history
- [ ] Order status tracking
- [ ] Email notifications (order confirmation, shipping updates)
- [ ] Inventory management
- [ ] Business name & logo integration
- [ ] SEO optimization with real product images

---

## 💳 Recommended Payment Stack

| Component | Recommendation |
|-----------|---------------|
| Payment processor | **Stripe** |
| Card payments | Stripe Elements / Checkout |
| Digital wallets | Apple Pay, Google Pay (via Stripe) |
| PayPal | Stripe PayPal integration or direct PayPal SDK |
| PCI compliance | Handled by Stripe (you never touch card numbers) |

---

## 🎨 Tech Stack

- **HTML5** + **CSS3** (custom properties, glassmorphism, responsive grid)
- **Vanilla JavaScript** (ES6+ classes, modules)
- **Three.js r128** (3D rendering, parametric shapes)
- **Google Fonts** (Inter, Outfit)
- **LocalStorage** for cart & admin data persistence (dev only)

---

## 📝 License

Proprietary — All rights reserved.
