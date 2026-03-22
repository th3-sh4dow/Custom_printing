// ===== CART PAGE =====
document.addEventListener('DOMContentLoaded', renderCart);

function renderCart() {
  const cart = getCart();
  const itemsEl = document.getElementById('cartItems');
  const summaryEl = document.getElementById('cartSummary');

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <a href="products.html" class="btn-primary">Start Shopping</a>
      </div>`;
    summaryEl.innerHTML = '';
    return;
  }

  let subtotal = 0;
  itemsEl.innerHTML = cart.map(item => {
    const p = getProductById(item.id);
    if (!p) return '';
    subtotal += p.price * item.qty;
    return `
      <div class="cart-item">
        <div class="cart-item-img"><i class="fa-solid ${p.icon}"></i></div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">₹${p.price} × ${item.qty} = ₹${p.price * item.qty}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="updateQty(${p.id}, ${item.qty - 1}); renderCart()">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${p.id}, ${item.qty + 1}); renderCart()">+</button>
            <button onclick="removeFromCart(${p.id}); renderCart()" style="background:none;border:none;color:red;cursor:pointer;font-size:18px;margin-left:8px"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  summaryEl.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-row"><span>Subtotal (${getCartCount()} items)</span><span>₹${subtotal}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span style="color:green">FREE</span>' : '₹' + shipping}</span></div>
    ${shipping > 0 ? `<div style="font-size:12px;color:#888;margin-bottom:8px">Add ₹${499 - subtotal} more for free shipping</div>` : ''}
    <div class="summary-row total"><span>Total</span><span>₹${total}</span></div>
    <a href="checkout.html" class="btn-primary full-width" style="margin-top:16px;display:block;text-align:center">Proceed to Checkout</a>
    <a href="https://wa.me/919142927996?text=Hi! I want to place an order. Total: ₹${total}" target="_blank" class="btn-whatsapp full-width" style="margin-top:10px;display:flex;justify-content:center">
      <i class="fa-brands fa-whatsapp"></i> Order via WhatsApp
    </a>
    <a href="products.html" class="btn-outline full-width" style="margin-top:10px;display:block;text-align:center">Continue Shopping</a>`;
}
