// ===== USER AUTH HELPER =====

const AUTH_KEY = 'cph_user_token';
const USER_KEY = 'cph_user_info';

function getUserToken() {
  return localStorage.getItem(AUTH_KEY);
}

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

function isLoggedIn() {
  return !!getUserToken();
}

function saveUserSession(token, user) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearUserSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getUserToken() };
}

// ── Update header user icon dynamically ──────────────────────────────────────
function updateHeaderAuth() {
  const userIconEl = document.querySelector('.user-icon');
  if (!userIconEl) return;

  if (isLoggedIn()) {
    const user = getUser();
    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    userIconEl.href = 'profile.html';
    userIconEl.title = user?.name || 'My Account';
    userIconEl.innerHTML = `
      <div class="user-avatar-mini" title="${user?.name || 'My Account'}">${initials}</div>
    `;
  } else {
    userIconEl.href = 'login.html';
    userIconEl.title = 'Login / Register';
    userIconEl.innerHTML = `<i class="fa-solid fa-user"></i>`;
  }
}

// ── Wishlist helpers ──────────────────────────────────────────────────────────
async function toggleWishlist(productId, btn) {
  if (!isLoggedIn()) {
    showToast('Please login to save to wishlist', 'error');
    setTimeout(() => { window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href); }, 1200);
    return;
  }
  try {
    const checkRes = await fetch(`/api/user/wishlist/check/${productId}`, { headers: authHeaders() });
    const { inWishlist } = await checkRes.json();
    if (inWishlist) {
      await fetch(`/api/user/wishlist/${productId}`, { method: 'DELETE', headers: authHeaders() });
      if (btn) { btn.classList.remove('wishlisted'); btn.title = 'Add to Wishlist'; }
      showToast('Removed from wishlist');
    } else {
      await fetch('/api/user/wishlist', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productId }) });
      if (btn) { btn.classList.add('wishlisted'); btn.title = 'Remove from Wishlist'; }
      showToast('Added to wishlist ❤️', 'success');
    }
  } catch {
    showToast('Something went wrong', 'error');
  }
}

async function checkWishlistStatus(productId, btn) {
  if (!isLoggedIn() || !btn) return;
  try {
    const res = await fetch(`/api/user/wishlist/check/${productId}`, { headers: authHeaders() });
    const { inWishlist } = await res.json();
    if (inWishlist) { btn.classList.add('wishlisted'); btn.title = 'Remove from Wishlist'; }
  } catch {}
}

// ── Pre-fill checkout form if user is logged in ───────────────────────────────
async function prefillCheckoutFromProfile() {
  if (!isLoggedIn()) return;
  try {
    const res = await fetch('/api/user/profile', { headers: authHeaders() });
    if (!res.ok) return;
    const profile = await res.json();
    const fields = {
      'fullName': profile.name,
      'phone': profile.phone,
      'email': profile.email,
      'address': profile.address,
      'city': profile.city,
      'state': profile.state,
      'pincode': profile.pincode
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    });
  } catch {}
}

// ── Run on every page load ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();
});
