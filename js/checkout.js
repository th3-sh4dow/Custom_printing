// ===== CHECKOUT PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromAPI();
  renderCheckoutSummary();
});

function renderCheckoutSummary() {
  const cart = getCart();
  const el = document.getElementById('checkoutSummary');
  if (!el) return;

  if (!cart.length) {
    el.innerHTML = `<p>Your cart is empty. <a href="products.html">Shop now</a></p>`;
    return;
  }

  let subtotal = 0;
  const itemsHtml = cart.map(item => {
    const p = getProductById(item.id);
    if (!p) return '';
    subtotal += p.price * item.qty;
    return `<div class="summary-row"><span>${p.name} × ${item.qty}</span><span>₹${p.price * item.qty}</span></div>`;
  }).join('');

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  el.innerHTML = `
    <h3>Order Summary</h3>
    ${itemsHtml}
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:green">FREE</span>' : '₹' + shipping}</span></div>
    <div class="summary-row total"><span>Total</span><span>₹${total}</span></div>
    <button onclick="placeOrder(${subtotal}, ${shipping}, ${total})" class="btn-primary full-width" style="margin-top:20px">
      <i class="fa-solid fa-check"></i> Place Order
    </button>
    <a href="https://wa.me/919142927996?text=Hi! I want to place an order. Total: ₹${total}" target="_blank" class="btn-whatsapp full-width" style="margin-top:10px;display:flex;justify-content:center">
      <i class="fa-brands fa-whatsapp"></i> Order via WhatsApp
    </a>`;
}

async function placeOrder(subtotal, shipping, total) {
  const name = document.getElementById('fullName')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const address = document.getElementById('address')?.value.trim();
  const city = document.getElementById('city')?.value.trim();
  const state = document.getElementById('state')?.value.trim();
  const pincode = document.getElementById('pincode')?.value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

  if (!name || !phone || !address || !city || !state || !pincode) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  const items = getCart().map(item => {
    const p = getProductById(item.id);
    return { id: item.id, name: p?.name, qty: item.qty, price: p?.price };
  }).filter(i => i.name);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, address, city, state, pincode, items, subtotal, shipping, total, payment })
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error placing order', 'error'); return; }

    // Save for confirmation page
    localStorage.setItem('cph_last_order', JSON.stringify({
      orderId: data.orderId, name, phone, address: `${address}, ${city}, ${state} - ${pincode}`,
      items, total, payment, date: new Date().toLocaleDateString('en-IN')
    }));
    localStorage.removeItem('cph_cart');
    window.location.href = 'order-confirmation.html';
  } catch {
    // Fallback if server is down
    const orderId = 'CPH' + Date.now().toString().slice(-6);
    localStorage.setItem('cph_last_order', JSON.stringify({
      orderId, name, phone, address: `${address}, ${city}, ${state} - ${pincode}`,
      items, total, payment, date: new Date().toLocaleDateString('en-IN')
    }));
    localStorage.removeItem('cph_cart');
    window.location.href = 'order-confirmation.html';
  }
}
