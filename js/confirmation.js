// ===== ORDER CONFIRMATION PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  const order = JSON.parse(localStorage.getItem('cph_last_order') || 'null');
  if (!order) {
    document.querySelector('.confirmation-page').innerHTML = `
      <div style="text-align:center;padding:60px">
        <h2>No order found</h2>
        <a href="index.html" class="btn-primary" style="margin-top:16px;display:inline-block">Go Home</a>
      </div>`;
    return;
  }

  document.getElementById('orderId').textContent = order.orderId;

  const itemsHtml = order.items.map(i => `
    <div class="summary-row"><span>${i.name} × ${i.qty}</span><span>₹${i.price * i.qty}</span></div>`).join('');

  document.getElementById('orderDetailsBox').innerHTML = `
    <h4 style="margin-bottom:12px;color:#1565C0">Order Details</h4>
    <div class="summary-row"><span>Customer</span><span>${order.name}</span></div>
    <div class="summary-row"><span>Phone</span><span>${order.phone}</span></div>
    <div class="summary-row"><span>Address</span><span style="text-align:right;max-width:200px">${order.address}</span></div>
    <div class="summary-row"><span>Date</span><span>${order.date}</span></div>
    <hr style="margin:12px 0;border-color:#eee"/>
    ${itemsHtml}
    <div class="summary-row total"><span>Total Paid</span><span>₹${order.total}</span></div>
    <div class="summary-row"><span>Payment</span><span style="text-transform:uppercase">${order.payment}</span></div>`;

  // Update WhatsApp link with order details
  const waMsg = `Hi! I just placed an order on Custom Printing Hub.\nOrder ID: ${order.orderId}\nName: ${order.name}\nTotal: ₹${order.total}\nPlease find my design attached.`;
  document.querySelector('.btn-whatsapp-big').href = `https://wa.me/919142927996?text=${encodeURIComponent(waMsg)}`;
});
