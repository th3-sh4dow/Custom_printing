// ===== PRODUCT DETAIL PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromAPI();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = getProductById(id);
  if (!product) { document.getElementById('productDetail').innerHTML = '<p style="padding:40px;text-align:center">Product not found.</p>'; return; }

  document.title = `${product.name} - Custom Printing Hub`;
  document.getElementById('breadProduct').textContent = product.name;

  let qty = 1;

  document.getElementById('productDetail').innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-img">
        <div class="main-img">
          ${product.image ? `<img src="${product.image}" alt="${product.name}" class="detail-main-image" />` : `<i class="fa-solid ${product.icon}"></i>`}
        </div>
      </div>
      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <div class="detail-rating">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} <span style="color:#666;font-size:14px">${product.rating} (${product.reviews} reviews)</span></div>
        <div class="detail-price">
          <span class="current">₹${product.price}</span>
          <span class="original">₹${product.originalPrice}</span>
          <span class="discount">${product.discount}% OFF</span>
        </div>
        <p style="font-size:14px;color:#555;margin-bottom:20px;line-height:1.6">${product.description}</p>
        <div class="detail-options">
          <label>Quantity</label>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-num" id="qtyDisplay">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-primary" onclick="addToCart(${product.id}, parseInt(document.getElementById('qtyDisplay').textContent)); window.location='cart.html'">
            <i class="fa-solid fa-cart-shopping"></i> Buy Now
          </button>
          <button class="btn-outline" onclick="addToCart(${product.id}, parseInt(document.getElementById('qtyDisplay').textContent))">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>
        <a href="https://wa.me/919142927996?text=Hi! I want to order: ${encodeURIComponent(product.name)} (₹${product.price})" target="_blank" class="whatsapp-order-btn">
          <i class="fa-brands fa-whatsapp"></i> Order via WhatsApp (+91 91429 27996)
        </a>
        <div class="product-features">
          <h4>Product Features</h4>
          <ul>${(product.features || []).map(f => `<li>${f}</li>`).join('')}</ul>
        </div>
      </div>
    </div>`;

  window.changeQty = function(delta) {
    qty = Math.max(1, qty + delta);
    document.getElementById('qtyDisplay').textContent = qty;
  };

  // Related products
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const relGrid = document.getElementById('relatedProducts');
  if (relGrid) {
    relGrid.innerHTML = related.map(p => `
      <div class="product-card" onclick="window.location='product-detail.html?id=${p.id}'">
        <div class="product-img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" class="product-image" />` : `<i class="fa-solid ${p.icon}"></i>`}
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price"><span class="price-current">₹${p.price}</span><span class="price-original">₹${p.originalPrice}</span></div>
          <button class="btn-add-cart" onclick="event.stopPropagation();addToCart(${p.id})">Add to Cart</button>
        </div>
      </div>`).join('');
  }
});
