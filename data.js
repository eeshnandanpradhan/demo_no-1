/* ==========================================================================
   data.js
   Shared data layer for the QuickBite food delivery app.
   Everything is persisted in the browser's localStorage — there is no
   server. Every page (index.html, user.html, admin.html) loads this file
   before its own script.
   ========================================================================== */

const DB_KEYS = {
  USERS: 'qb_users',
  MENU: 'qb_menu',
  ORDERS: 'qb_orders',
  SESSION: 'qb_session'
};

/* Seed the store with an admin account and a starter menu the first time
   the app runs on a browser. Safe to call on every page load. */
function initData() {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const admin = {
      id: 'u-admin',
      name: 'Restaurant Admin',
      email: 'admin@quickbite.com',
      phone: '',
      password: 'admin123',
      role: 'admin',
      joined: new Date().toISOString()
    };
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify([admin]));
  }

  if (!localStorage.getItem(DB_KEYS.MENU)) {
    const menu = [
      { id: 'm1', name: 'Paneer Tikka', category: 'Starters', price: 180, desc: 'Char-grilled cottage cheese, smoked pepper marinade', img: '🧆', available: true },
      { id: 'm2', name: 'Chicken 65', category: 'Starters', price: 220, desc: 'Fiery fried chicken tossed with curry leaf and garlic', img: '🍗', available: true },
      { id: 'm3', name: 'Butter Chicken', category: 'Main Course', price: 320, desc: 'Slow-cooked tomato gravy finished with cream and butter', img: '🍛', available: true },
      { id: 'm4', name: 'Vegetable Biryani', category: 'Main Course', price: 250, desc: 'Basmati rice layered with garden vegetables and spice', img: '🍚', available: true },
      { id: 'm5', name: 'Masala Dosa', category: 'Main Course', price: 140, desc: 'Crisp rice crepe with a spiced potato filling', img: '🌯', available: true },
      { id: 'm6', name: 'Gulab Jamun', category: 'Desserts', price: 90, desc: 'Warm milk dumplings soaked in saffron syrup', img: '🍮', available: true },
      { id: 'm7', name: 'Rasmalai', category: 'Desserts', price: 110, desc: 'Chilled cottage cheese discs in cardamom cream', img: '🍨', available: true },
      { id: 'm8', name: 'Masala Chai', category: 'Beverages', price: 40, desc: 'Spiced tea, brewed strong', img: '☕', available: true },
      { id: 'm9', name: 'Fresh Lime Soda', category: 'Beverages', price: 60, desc: 'Sweet, salted, or mixed — your call', img: '🥤', available: true }
    ];
    localStorage.setItem(DB_KEYS.MENU, JSON.stringify(menu));
  }

  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
  }
}

/* ---- users ---- */
function getUsers() { return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'); }
function saveUsers(users) { localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users)); }

/* ---- menu ---- */
function getMenu() { return JSON.parse(localStorage.getItem(DB_KEYS.MENU) || '[]'); }
function saveMenu(menu) { localStorage.setItem(DB_KEYS.MENU, JSON.stringify(menu)); }

/* ---- orders ---- */
function getOrders() { return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]'); }
function saveOrders(orders) { localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders)); }

/* ---- session (who is currently logged in) ---- */
function getSession() { return JSON.parse(localStorage.getItem(DB_KEYS.SESSION) || 'null'); }
function setSession(user) {
  localStorage.setItem(DB_KEYS.SESSION, JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role
  }));
}
function clearSession() { localStorage.removeItem(DB_KEYS.SESSION); }

/* ---- per-user cart ---- */
function cartKey(userId) { return 'qb_cart_' + userId; }
function getCart(userId) { return JSON.parse(localStorage.getItem(cartKey(userId)) || '[]'); }
function saveCart(userId, cart) { localStorage.setItem(cartKey(userId), JSON.stringify(cart)); }

/* ---- small utilities ---- */
function uid(prefix) { return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000); }
function formatMoney(n) { return '₹' + Number(n).toFixed(2); }
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

initData();
