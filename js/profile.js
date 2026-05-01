// ===== PROFILE PAGE LOGIC =====

let currentProfile = null;
let allOrders = [];
let allWishlist = [];

// Redirect if not logged in
if (!isLoggedIn()) {
  window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();
  await loadDashboard();
  // Check URL hash for tab
  const hash = window.location.hash.slice(1);
  if (hash) switchProfileTab(hash);
});

async function loadProfile() {
  try {
    const res = await fetch('/api/user/profile', { headers: authHeaders() });
    if (!res.ok) throw new Error();
    currentProfile = await res.json();
    
    // Update sidebar
    const initials = currentProfile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileName').textContent = currentProfile.name;
    document.getElementById('profileEmail').textContent = currentProfile.email;
    
    // Fill edit form
    document.getElementById('editName').value = currentProfile.name || '';
    document.getElementById('editEmail').value = currentProfile.email || '';
    document.getElementById('editPhone').value = currentProfile.phone || '';
    document.getElementById('editAddress').value = currentProfile.address || '';
    document.getElementById('editCity').value = currentProfile.city || '';
    document.getElementById('editState').value = currentProfile.state || '';
    document.getElementById('editPincode').value = currentProfile.pincode || '';
  } catch {
    showToast('Failed to load profile', 'error');
  }
}

async function loadDashboard() {
  try {
    // Load orders
    const ordersRes = await fetch('/api/user/orders', { headers: authHeaders() });
    allOrders = await ordersRes.json();
    
    // Load wishlist
    const wishRes = await fetch('/api/user/wishlist', { headers: authHeaders() });
    allWishlist = await wishRes.json();
    
    // Update stats
    document.getElementById('statOrders').textContent = allOrders.length;
    document.getElementById('statWishlist').textContent = allWishlist.length;
    document.getElementById('statPending').textContent = allOrders.filter(o => o.status === 'pending').length;
    
    // Show recent orders (top 3)
    renderRecentOrders(allOrders.slice(0, 3));
  } catch {
    showToast('Failed to load dashboard', 'error');
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recentOrdersList');
  if (!orders.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No orders yet</p><a href="products.html" class="btn-outline">Start Shopping</a></div>';
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="order-card" onclick="viewOrder('${o.orderId}')">
      <div class="order-header">
        <div>
          <strong>Order #${o.orderId}</strong>
          <span class="order-date">${new Date(o.createdAt).toLocaleDateString()}</span>
        </div>
        <span class="order-status status-${o.status}">${o.status}</span>
      </div>
      <div class="order-items-preview">
        ${o.items.slice(0, 2).map(item => `<span>${item.name} (x${item.qty})</span>`).join(', ')}
        ${o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
      </div>
      <div class="order-footer">
        <strong>₹${o.total}</strong>
        <span>${o.items.reduce((sum, i) => sum + i.qty, 0)} items</span>
      </div>
    </div>
  `).join('');
}

async function loadOrders() {
  const status = document.getElementById('orderStatusFilter').value;
  const filtered = status ? allOrders.filter(o => o.status === status) : allOrders;
  
  const container = document.getElementById('ordersList');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No orders found</p><a href="products.html" class="btn-outline">Start Shopping</a></div>';
    return;
  }
  
  container.innerHTML = filtered.map(o => `
    <div class="order-card" onclick="viewOrder('${o.orderId}')">
      <div class="order-header">
        <div>
          <strong>Order #${o.orderId}</strong>
          <span class="order-date">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <span class="order-status status-${o.status}">${o.status}</span>
      </div>
      <div class="order-items-preview">
        ${o.items.map(item => `<span>${item.name} (x${item.qty})</span>`).join(', ')}
      </div>
      <div class="order-footer">
        <strong>₹${o.total}</strong>
        <span>${o.items.reduce((sum, i) => sum + i.qty, 0)} items • ${o.payment.toUpperCase()}</span>
      </div>
    </div>
  `).join('');
}

async function loadWishlist() {
  try {
    const res = await fetch('/api/user/wishlist', { headers: authHeaders() });
    allWishlist = await res.json();
    document.getElementById('statWishlist').textContent = allWishlist.length;
    
    const container = document.getElementById('wishlistGrid');
    if (!allWishlist.length) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-heart-crack"></i><p>Your wishlist is empty</p><a href="products.html" class="btn-outline">Browse Products</a></div>';
      return;
    }
    
    container.innerHTML = allWishlist.map(item => `
      <div class="product-card">
        <div class="product-img" onclick="window.location.href='product-detail.html?id=${item.productId}'">
          ${item.image ? `<img src="${item.image}" alt="${item.name}"/>` : `<i class="${item.icon}"></i>`}
          ${item.badge ? `<span class="product-badge">${item.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <div class="product-name">${item.name}</div>
          <div class="product-price">
            <span class="price-current">₹${item.price}</span>
            ${item.discount > 0 ? `<span class="price-original">₹${item.originalPrice}</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick="addToCart(${item.productId}); removeFromWishlist(${item.productId})">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn-remove-wish" onclick="removeFromWishlist(${item.productId})">
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `).join('');
  } catch {
    showToast('Failed to load wishlist', 'error');
  }
}

async function removeFromWishlist(productId) {
  try {
    await fetch(`/api/user/wishlist/${productId}`, { method: 'DELETE', headers: authHeaders() });
    showToast('Removed from wishlist');
    await loadWishlist();
  } catch {
    showToast('Failed to remove', 'error');
  }
}

async function updateProfile() {
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const address = document.getElementById('editAddress').value.trim();
  const city = document.getElementById('editCity').value.trim();
  const state = document.getElementById('editState').value.trim();
  const pincode = document.getElementById('editPincode').value.trim();
  
  const errEl = document.getElementById('profileUpdateError');
  const sucEl = document.getElementById('profileUpdateSuccess');
  errEl.style.display = 'none';
  sucEl.style.display = 'none';
  
  if (!name) {
    errEl.textContent = 'Name is required';
    errEl.style.display = 'block';
    return;
  }
  
  try {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name, phone, address, city, state, pincode })
    });
    if (!res.ok) throw new Error();
    
    sucEl.textContent = 'Profile updated successfully!';
    sucEl.style.display = 'block';
    
    // Update local user info
    const user = getUser();
    user.name = name;
    user.phone = phone;
    saveUserSession(getUserToken(), user);
    
    await loadProfile();
    setTimeout(() => sucEl.style.display = 'none', 3000);
  } catch {
    errEl.textContent = 'Failed to update profile';
    errEl.style.display = 'block';
  }
}

async function changePassword() {
  const current = document.getElementById('currentPass').value;
  const newPass = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmPass').value;
  
  const errEl = document.getElementById('passwordError');
  const sucEl = document.getElementById('passwordSuccess');
  errEl.style.display = 'none';
  sucEl.style.display = 'none';
  
  if (!current || !newPass || !confirm) {
    errEl.textContent = 'All fields are required';
    errEl.style.display = 'block';
    return;
  }
  if (newPass.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters';
    errEl.style.display = 'block';
    return;
  }
  if (newPass !== confirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.style.display = 'block';
    return;
  }
  
  try {
    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword: current, newPassword: newPass })
    });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || 'Failed to change password';
      errEl.style.display = 'block';
      return;
    }
    
    sucEl.textContent = 'Password changed successfully!';
    sucEl.style.display = 'block';
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
    setTimeout(() => sucEl.style.display = 'none', 3000);
  } catch {
    errEl.textContent = 'Server error';
    errEl.style.display = 'block';
  }
}

function switchProfileTab(tab) {
  // Update nav
  document.querySelectorAll('.profile-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  
  // Update tabs
  document.querySelectorAll('.profile-tab').forEach(el => el.classList.remove('active'));
  const tabMap = { overview: 'tabOverview', orders: 'tabOrders', wishlist: 'tabWishlist', profile: 'tabProfile', security: 'tabSecurity' };
  document.getElementById(tabMap[tab])?.classList.add('active');
  
  // Load data if needed
  if (tab === 'orders') loadOrders();
  if (tab === 'wishlist') loadWishlist();
  
  // Update URL hash
  window.location.hash = tab;
}

function viewOrder(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;
  
  document.getElementById('orderModalBody').innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-section">
        <h4><i class="fa-solid fa-info-circle"></i> Order Information</h4>
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
        <p><strong>Status:</strong> <span class="order-status status-${order.status}">${order.status}</span></p>
        <p><strong>Payment:</strong> ${order.payment.toUpperCase()}</p>
      </div>
      <div class="order-detail-section">
        <h4><i class="fa-solid fa-location-dot"></i> Delivery Address</h4>
        <p><strong>${order.name}</strong></p>
        <p>${order.phone}</p>
        <p>${order.address}</p>
        <p>${order.city}, ${order.state} - ${order.pincode}</p>
      </div>
    </div>
    <div class="order-detail-section">
      <h4><i class="fa-solid fa-box"></i> Items (${order.items.length})</h4>
      <table class="order-items-table">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.qty}</td>
              <td>₹${item.price}</td>
              <td>₹${item.price * item.qty}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="order-summary-box">
      <div class="summary-row"><span>Subtotal:</span><span>₹${order.subtotal}</span></div>
      <div class="summary-row"><span>Shipping:</span><span>₹${order.shipping}</span></div>
      <div class="summary-row total"><span>Total:</span><span>₹${order.total}</span></div>
    </div>
    ${order.notes ? `<div class="order-notes"><strong>Notes:</strong> ${order.notes}</div>` : ''}
    <div style="text-align:center; margin-top:20px">
      <a href="https://wa.me/919142927996?text=Hi, I want to check status of Order ${order.orderId}" target="_blank" class="btn-whatsapp">
        <i class="fa-brands fa-whatsapp"></i> Contact on WhatsApp
      </a>
    </div>
  `;
  document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
}

function doLogout() {
  if (confirm('Are you sure you want to logout?')) {
    clearUserSession();
    window.location.href = 'index.html';
  }
}
