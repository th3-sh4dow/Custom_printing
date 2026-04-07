const API = '';  // same origin

let token = localStorage.getItem('cph_admin_token') || '';

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (token) {
    showApp();
  }

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const page = el.dataset.page;
      navigateTo(page);
    });
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', designs: 'Design Requests', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'orders') loadOrders();
  if (page === 'products') loadProducts();
  if (page === 'designs') loadDesigns();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
    token = data.token;
    localStorage.setItem('cph_admin_token', token);
    localStorage.setItem('cph_admin_user', data.username);
    showApp();
  } catch {
    errEl.textContent = 'Server error. Make sure the server is running.';
    errEl.style.display = 'block';
  }
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  document.getElementById('adminName').textContent = localStorage.getItem('cph_admin_user') || 'Admin';
  loadDashboard();
}

function doLogout() {
  token = '';
  localStorage.removeItem('cph_admin_token');
  localStorage.removeItem('cph_admin_user');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminApp').style.display = 'none';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── API helper ───────────────────────────────────────────────────────────────
async function api(method, path, body = null, isForm = false) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}` }
  };
  if (body && !isForm) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  if (body && isForm) opts.body = body;
  const res = await fetch(API + path, opts);
  if (res.status === 401) { doLogout(); return null; }
  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  const data = await api('GET', '/api/admin/stats');
  if (!data) return;
  document.getElementById('stat-orders').textContent = data.totalOrders;
  document.getElementById('stat-revenue').textContent = '₹' + data.totalRevenue.toLocaleString('en-IN');
  document.getElementById('stat-pending').textContent = data.pendingOrders;
  document.getElementById('stat-products').textContent = data.totalProducts;
  document.getElementById('stat-designs').textContent = data.designRequests;

  const tbody = document.getElementById('recentOrdersBody');
  tbody.innerHTML = data.recentOrders.map(o => `
    <tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.name}</td>
      <td>₹${o.total}</td>
      <td><span class="badge badge-${o.status}">${o.status}</span></td>
      <td>${fmtDate(o.createdAt)}</td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#888">No orders yet</td></tr>';
}

// ── Orders ───────────────────────────────────────────────────────────────────
async function loadOrders() {
  const search = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || 'all';
  const params = new URLSearchParams({ status, search });
  const orders = await api('GET', `/api/admin/orders?${params}`);
  if (!orders) return;

  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td>${o.items.length} item(s)</td>
      <td>₹${o.total}</td>
      <td>${o.payment.toUpperCase()}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
          ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </td>
      <td>${fmtDate(o.createdAt)}</td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="btn-sm btn-view" onclick="viewOrder(${o.id})"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-sm btn-delete" onclick="deleteOrder(${o.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:#888">No orders found</td></tr>';
}

async function updateOrderStatus(id, status) {
  await api('PATCH', `/api/admin/orders/${id}/status`, { status });
  loadDashboard();
}

async function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  await api('DELETE', `/api/admin/orders/${id}`);
  loadOrders();
  loadDashboard();
}

let allOrders = [];
async function viewOrder(id) {
  const orders = await api('GET', '/api/admin/orders?status=all&search=');
  if (!orders) return;
  const o = orders.find(x => x.id === id);
  if (!o) return;

  document.getElementById('orderModalBody').innerHTML = `
    <div class="order-detail-grid">
      <div class="detail-block">
        <h4>Customer Info</h4>
        <p><strong>${o.name}</strong></p>
        <p>📞 ${o.phone}</p>
        ${o.email ? `<p>✉️ ${o.email}</p>` : ''}
      </div>
      <div class="detail-block">
        <h4>Delivery Address</h4>
        <p>${o.address}</p>
        <p>${o.city}, ${o.state} - ${o.pincode}</p>
      </div>
    </div>
    <div class="detail-block" style="margin-bottom:12px">
      <h4>Order Items</h4>
      <table class="items-table">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${o.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price * i.qty}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="order-detail-grid">
      <div class="detail-block">
        <h4>Payment</h4>
        <p>${o.payment.toUpperCase()}</p>
        <p>Shipping: ₹${o.shipping}</p>
        <p><strong>Total: ₹${o.total}</strong></p>
      </div>
      <div class="detail-block">
        <h4>Status & Date</h4>
        <p><span class="badge badge-${o.status}">${o.status}</span></p>
        <p style="margin-top:6px">${fmtDate(o.createdAt)}</p>
        ${o.notes ? `<p style="margin-top:6px;color:#888">${o.notes}</p>` : ''}
      </div>
    </div>`;
  document.getElementById('orderModal').style.display = 'flex';
}

// ── Products ─────────────────────────────────────────────────────────────────
async function loadProducts() {
  const products = await api('GET', '/api/admin/products');
  if (!products) return;

  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.image ? `<img src="${p.image}" class="product-thumb" onerror="this.style.display='none'"/>` : `<div class="product-thumb-icon"><i class="fa-solid ${p.icon}"></i></div>`}</td>
      <td><strong>${p.name}</strong>${p.badge ? ` <span class="badge badge-confirmed">${p.badge}</span>` : ''}</td>
      <td>${capitalize(p.category)}</td>
      <td>₹${p.price} <span style="color:#aaa;text-decoration:line-through;font-size:12px">₹${p.originalPrice}</span></td>
      <td><span class="badge ${p.inStock ? 'badge-delivered' : 'badge-cancelled'}">${p.inStock ? 'In Stock' : 'Out'}</span></td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="btn-sm btn-edit" onclick="openProductModal(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function openProductModal(id = null) {
  document.getElementById('productModalTitle').textContent = id ? 'Edit Product' : 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('pId').value = id || '';
  document.getElementById('pImagePreview').innerHTML = '';

  if (id) {
    api('GET', `/api/products/${id}`).then(p => {
      if (!p) return;
      document.getElementById('pName').value = p.name;
      document.getElementById('pCategory').value = p.category;
      document.getElementById('pPrice').value = p.price;
      document.getElementById('pOriginalPrice').value = p.originalPrice;
      document.getElementById('pDiscount').value = p.discount;
      document.getElementById('pBadge').value = p.badge || '';
      document.getElementById('pIcon').value = p.icon || '';
      document.getElementById('pInStock').value = p.inStock ? '1' : '0';
      document.getElementById('pDescription').value = p.description || '';
      document.getElementById('pFeatures').value = (p.features || []).join('\n');
      if (p.image) document.getElementById('pImagePreview').innerHTML = `<img src="${p.image}" style="height:60px;border-radius:8px;margin-top:4px"/>`;
    });
  }
  document.getElementById('productModal').style.display = 'flex';
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('pId').value;
  const fd = new FormData();
  fd.append('name', document.getElementById('pName').value);
  fd.append('category', document.getElementById('pCategory').value);
  fd.append('price', document.getElementById('pPrice').value);
  fd.append('originalPrice', document.getElementById('pOriginalPrice').value);
  fd.append('discount', document.getElementById('pDiscount').value || 0);
  fd.append('badge', document.getElementById('pBadge').value);
  fd.append('icon', document.getElementById('pIcon').value || 'fa-box');
  fd.append('inStock', document.getElementById('pInStock').value);
  fd.append('description', document.getElementById('pDescription').value);
  const featLines = document.getElementById('pFeatures').value.split('\n').map(s => s.trim()).filter(Boolean);
  fd.append('features', JSON.stringify(featLines));
  const imgFile = document.getElementById('pImage').files[0];
  if (imgFile) fd.append('image', imgFile);

  const method = id ? 'PUT' : 'POST';
  const path = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const res = await api(method, path, fd, true);
  if (res?.success) {
    closeModal('productModal');
    loadProducts();
    loadDashboard();
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await api('DELETE', `/api/admin/products/${id}`);
  loadProducts();
  loadDashboard();
}

// ── Design Requests ──────────────────────────────────────────────────────────
async function loadDesigns() {
  const designs = await api('GET', '/api/admin/design-requests');
  if (!designs) return;

  const tbody = document.getElementById('designsBody');
  tbody.innerHTML = designs.map(d => `
    <tr>
      <td>${d.name}</td>
      <td>${d.phone}</td>
      <td>${capitalize(d.product)}</td>
      <td>${d.qty}</td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.notes || '-'}</td>
      <td>${d.imageFile ? `<a href="uploads/${d.imageFile}" target="_blank" class="btn-sm btn-view"><i class="fa-solid fa-image"></i> View</a>` : '-'}</td>
      <td>
        <select class="status-select" onchange="updateDesignStatus(${d.id}, this.value)">
          ${['new','in-progress','done'].map(s =>
            `<option value="${s}" ${d.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </td>
      <td>${fmtDate(d.createdAt)}</td>
      <td>
        <a href="https://wa.me/${d.phone.replace(/\D/g,'')}" target="_blank" class="btn-sm btn-edit">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
      </td>
    </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:#888">No design requests yet</td></tr>';
}

async function updateDesignStatus(id, status) {
  await api('PATCH', `/api/admin/design-requests/${id}/status`, { status });
}

// ── Settings ─────────────────────────────────────────────────────────────────
async function changePassword() {
  const currentPassword = document.getElementById('curPw').value;
  const newPassword = document.getElementById('newPw').value;
  const confirm = document.getElementById('confPw').value;
  const msgEl = document.getElementById('pwMsg');
  const errEl = document.getElementById('pwErr');
  msgEl.style.display = 'none'; errEl.style.display = 'none';

  if (newPassword !== confirm) { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }
  if (newPassword.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.style.display = 'block'; return; }

  const res = await api('POST', '/api/admin/change-password', { currentPassword, newPassword });
  if (res?.success) { msgEl.textContent = 'Password updated successfully!'; msgEl.style.display = 'block'; document.getElementById('curPw').value = ''; document.getElementById('newPw').value = ''; document.getElementById('confPw').value = ''; }
  else { errEl.textContent = res?.error || 'Error'; errEl.style.display = 'block'; }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
});

// Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') doLogin();
});
