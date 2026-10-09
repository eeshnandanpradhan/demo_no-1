/* ==========================================================================
   user.js — powers the User module (user.html)
   ========================================================================== */

let currentUser = null;
let activeCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {

  // ---- guard: must be logged in as a regular user ----
  const session = getSession();
  if (!session) { window.location.href = 'index.html'; return; }
  if (session.role !== 'user') { window.location.href = 'admin.html'; return; }
  currentUser = session;

  document.getElementById('user-name-label').textContent = currentUser.name.split(' ')[0];

  // ---- module-wise navigation between sections (JS driven) ----
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  renderCategories();
  renderMenu();
  renderCart();
  renderOrders();
  updateCartBadge();
});

function showSection(name) {
  ['menu', 'cart', 'orders'].forEach(section => {
    document.getElementById('section-' + section).classList.toggle('is-hidden', section !== name);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.section === name);
  });
  if (name === 'cart') renderCart();
  if (name === 'orders') renderOrders();
}

/* ===================== MENU ===================== */

function renderCategories() {
  const menu = getMenu();
  const categories = ['All', ...new Set(menu.map(item => item.category))];
  const row = document.getElementById('category-row');
  row.innerHTML = '';
  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (cat === activeCategory ? ' is-active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCategory = cat;
      renderCategories();
      renderMenu();
    });
    row.appendChild(chip);
  });
}

function renderMenu() {
  const menu = getMenu().filter(item => activeCategory === 'All' || item.category === activeCategory);
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = '';

  if (menu.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-emoji">🍽️</div>Nothing in this category yet.</div>';
    return;
  }

  const cart = getCart(currentUser.id);

  menu.forEach(item => {
    const inCart = cart.find(c => c.itemId === item.id);
    const card = document.createElement('div');
    card.className = 'food-card';

    card.innerHTML = `
      <div class="food-emoji">${item.img}</div>
      <span class="food-cat">${item.category.toUpperCase()}</span>
      <h3>${item.name}</h3>
      <p class="food-desc">${item.desc}</p>
      <div class="food-card-footer">
        <span class="food-price">${formatMoney(item.price)}</span>
        <span class="qty-slot"></span>
      </div>
    `;

    const qtySlot = card.querySelector('.qty-slot');

    if (!item.available) {
      const tag = document.createElement('span');
      tag.className = 'unavailable-tag';
      tag.textContent = 'Sold out';
      qtySlot.appendChild(tag);
    } else if (inCart) {
      qtySlot.appendChild(buildStepper(item, inCart.qty));
    } else {
      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary btn-sm';
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', () => { changeCartQty(item, 1); renderMenu(); });
      qtySlot.appendChild(addBtn);
    }

    grid.appendChild(card);
  });
}

function buildStepper(item, qty) {
  const wrap = document.createElement('div');
  wrap.className = 'stepper';
  wrap.innerHTML = `<button type="button" data-dir="-1">−</button><span>${qty}</span><button type="button" data-dir="1">+</button>`;
  wrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      changeCartQty(item, Number(btn.dataset.dir));
      renderMenu();
    });
  });
  return wrap;
}

/* ===================== CART ===================== */

function changeCartQty(item, delta) {
  let cart = getCart(currentUser.id);
  const existing = cart.find(c => c.itemId === item.id);

  if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) cart = cart.filter(c => c.itemId !== item.id);
  } else if (delta > 0) {
    cart.push({ itemId: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
  }

  saveCart(currentUser.id, cart);
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart(currentUser.id);
  const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
  const badge = document.getElementById('cart-badge');
  badge.textContent = totalQty;
  badge.classList.toggle('is-hidden', totalQty === 0);
}

function renderCart() {
  const cart = getCart(currentUser.id);
  const content = document.getElementById('cart-content');

  if (cart.length === 0) {
    content.innerHTML = '<div class="empty-state"><div class="empty-emoji">🛒</div>Your cart is empty — go add something tasty.</div>';
    return;
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  content.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list" id="cart-list"></div>
      <div class="summary-card">
        <div class="summary-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery fee</span><span>${formatMoney(deliveryFee)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
        <div class="field">
          <label for="delivery-address">Delivery address</label>
          <textarea id="delivery-address" rows="3" placeholder="Flat / street / landmark"></textarea>
        </div>
        <p class="auth-message" id="checkout-message"></p>
        <button type="button" class="btn btn-secondary btn-block" id="place-order-btn">Place order</button>
      </div>
    </div>
  `;

  const list = document.getElementById('cart-list');
  cart.forEach(c => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="food-emoji">${c.img}</div>
      <div class="cart-row-info">
        <h4>${c.name}</h4>
        <span>${formatMoney(c.price)} × ${c.qty} = ${formatMoney(c.price * c.qty)}</span>
      </div>
      <span class="qty-slot"></span>
    `;
    row.querySelector('.qty-slot').appendChild(buildStepper({ id: c.itemId, price: c.price, name: c.name, img: c.img }, c.qty));
    list.appendChild(row);
  });

  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
}

function placeOrder() {
  const cart = getCart(currentUser.id);
  const address = document.getElementById('delivery-address').value.trim();
  const msg = document.getElementById('checkout-message');

  if (cart.length === 0) return;
  if (!address) {
    msg.textContent = 'Please add a delivery address.';
    msg.className = 'auth-message is-error';
    return;
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const deliveryFee = 30;

  const order = {
    id: uid('ord'),
    userId: currentUser.id,
    userName: currentUser.name,
    items: cart,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    address,
    status: 'Placed',
    date: new Date().toISOString()
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  saveCart(currentUser.id, []);
  updateCartBadge();

  showSection('orders');
}

/* ===================== ORDERS ===================== */

function renderOrders() {
  const orders = getOrders()
    .filter(o => o.userId === currentUser.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const content = document.getElementById('orders-content');

  if (orders.length === 0) {
    content.innerHTML = '<div class="empty-state"><div class="empty-emoji">📦</div>No orders yet — your history will show up here.</div>';
    return;
  }

  content.innerHTML = '<div class="order-list"></div>';
  const list = content.querySelector('.order-list');

  orders.forEach(order => {
    const itemsSummary = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    const statusClass = 'status-' + order.status.replace(/ /g, '-');
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-card-top">
        <div>
          <div class="order-id">#${order.id.slice(-6).toUpperCase()}</div>
          <div class="order-date">${formatDate(order.date)}</div>
        </div>
        <span class="status-pill ${statusClass}">${order.status}</span>
      </div>
      <div class="order-items">${itemsSummary}</div>
      <div class="order-total">${formatMoney(order.total)} <span style="color:var(--text-muted); font-weight:400;">· delivering to ${order.address}</span></div>
    `;
    list.appendChild(card);
  });
}
