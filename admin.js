/* ==========================================================================
   admin.js — powers the Admin module (admin.html)
   ========================================================================== */

let adminUser = null;
const STATUSES = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

document.addEventListener('DOMContentLoaded', () => {

  // ---- guard: must be logged in as admin ----
  const session = getSession();
  if (!session) { window.location.href = 'index.html'; return; }
  if (session.role !== 'admin') { window.location.href = 'user.html'; return; }
  adminUser = session;

  document.getElementById('admin-name-label').textContent = adminUser.name;

  // ---- module-wise navigation between sections (JS driven) ----
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  document.getElementById('menu-form').addEventListener('submit', handleMenuFormSubmit);
  document.getElementById('menu-cancel-btn').addEventListener('click', resetMenuForm);

  renderDashboard();
  renderMenuTable();
  renderOrdersTable();
  renderCustomersTable();
});

function showSection(name) {
  ['dashboard', 'menu', 'orders', 'customers'].forEach(section => {
    document.getElementById('section-' + section).classList.toggle('is-hidden', section !== name);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.section === name);
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders') renderOrdersTable();
  if (name === 'customers') renderCustomersTable();
}

/* ===================== DASHBOARD ===================== */

function renderDashboard() {
  const orders = getOrders();
  const menu = getMenu();
  const customers = getUsers().filter(u => u.role === 'user');
  const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: 'Total orders', value: orders.length },
    { label: 'Revenue', value: formatMoney(revenue) },
    { label: 'Customers', value: customers.length },
    { label: 'Menu items', value: menu.length }
  ];

  const grid = document.getElementById('stat-grid');
  grid.innerHTML = '';
  stats.forEach(s => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div>`;
    grid.appendChild(card);
  });

  const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const tbody = document.querySelector('#recent-orders-table tbody');
  tbody.innerHTML = '';

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);">No orders placed yet.</td></tr>';
    return;
  }

  recent.forEach(o => {
    const tr = document.createElement('tr');
    const statusClass = 'status-' + o.status.replace(/ /g, '-');
    tr.innerHTML = `
      <td>#${o.id.slice(-6).toUpperCase()}</td>
      <td>${o.userName}</td>
      <td>${o.items.map(i => i.name + ' ×' + i.qty).join(', ')}</td>
      <td>${formatMoney(o.total)}</td>
      <td><span class="status-pill ${statusClass}">${o.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===================== MENU MANAGEMENT ===================== */

function renderMenuTable() {
  const menu = getMenu();
  const tbody = document.querySelector('#menu-table tbody');
  tbody.innerHTML = '';

  menu.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.img} ${item.name}</td>
      <td>${item.category}</td>
      <td>${formatMoney(item.price)}</td>
      <td>${item.available ? '<span class="status-pill status-Delivered">Available</span>' : '<span class="status-pill status-Cancelled">Sold out</span>'}</td>
      <td><div class="row-actions">
        <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
        <button type="button" class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div></td>
    `;
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => loadMenuItemIntoForm(item.id));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteMenuItem(item.id));
    tbody.appendChild(tr);
  });
}

function handleMenuFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('menu-item-id').value;
  const name = document.getElementById('menu-name').value.trim();
  const category = document.getElementById('menu-category').value;
  const price = Number(document.getElementById('menu-price').value);
  const img = document.getElementById('menu-emoji').value.trim() || '🍽️';
  const desc = document.getElementById('menu-desc').value.trim() || 'A QuickBite favorite.';
  const available = document.getElementById('menu-available').checked;

  if (!name || !price) return;

  const menu = getMenu();

  if (id) {
    const item = menu.find(m => m.id === id);
    Object.assign(item, { name, category, price, img, desc, available });
  } else {
    menu.push({ id: uid('m'), name, category, price, img, desc, available });
  }

  saveMenu(menu);
  renderMenuTable();
  renderDashboard();
  resetMenuForm();
}

function loadMenuItemIntoForm(id) {
  const item = getMenu().find(m => m.id === id);
  if (!item) return;

  document.getElementById('menu-item-id').value = item.id;
  document.getElementById('menu-name').value = item.name;
  document.getElementById('menu-category').value = item.category;
  document.getElementById('menu-price').value = item.price;
  document.getElementById('menu-emoji').value = item.img;
  document.getElementById('menu-desc').value = item.desc;
  document.getElementById('menu-available').checked = item.available;

  document.getElementById('menu-form-title').textContent = 'Edit dish';
  document.getElementById('menu-submit-btn').textContent = 'Save changes';
  document.getElementById('menu-cancel-btn').classList.remove('is-hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetMenuForm() {
  document.getElementById('menu-form').reset();
  document.getElementById('menu-item-id').value = '';
  document.getElementById('menu-available').checked = true;
  document.getElementById('menu-form-title').textContent = 'Add a new item';
  document.getElementById('menu-submit-btn').textContent = 'Add item';
  document.getElementById('menu-cancel-btn').classList.add('is-hidden');
}

function deleteMenuItem(id) {
  if (!confirm('Remove this dish from the menu?')) return;
  saveMenu(getMenu().filter(m => m.id !== id));
  renderMenuTable();
  renderDashboard();
}

/* ===================== ORDER MANAGEMENT ===================== */

function renderOrdersTable() {
  const orders = [...getOrders()].sort((a, b) => new Date(b.date) - new Date(a.date));
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);">No orders placed yet.</td></tr>';
    return;
  }

  orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${order.id.slice(-6).toUpperCase()}</td>
      <td>${order.userName}</td>
      <td>${order.items.map(i => i.name + ' ×' + i.qty).join(', ')}</td>
      <td>${order.address}</td>
      <td>${formatMoney(order.total)}</td>
      <td>${formatDate(order.date)}</td>
      <td><select class="status-select" data-order-id="${order.id}">
        ${STATUSES.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select></td>
    `;
    tr.querySelector('select').addEventListener('change', (e) => updateOrderStatus(order.id, e.target.value));
    tbody.appendChild(tr);
  });
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveOrders(orders);
  renderDashboard();
}

/* ===================== CUSTOMERS ===================== */

function renderCustomersTable() {
  const customers = getUsers().filter(u => u.role === 'user');
  const orders = getOrders();
  const tbody = document.querySelector('#customers-table tbody');
  tbody.innerHTML = '';

  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);">No customers have signed up yet.</td></tr>';
    return;
  }

  customers.forEach(c => {
    const orderCount = orders.filter(o => o.userId === c.id).length;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone || '—'}</td>
      <td>${formatDate(c.joined)}</td>
      <td>${orderCount}</td>
    `;
    tbody.appendChild(tr);
  });
}
