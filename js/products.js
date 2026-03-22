// ===== PRODUCTS PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat') || 'all';
  if (cat !== 'all') {
    const radio = document.querySelector(`input[name="cat"][value="${cat}"]`);
    if (radio) radio.checked = true;
  }
  filterProducts();
});

function filterProducts() {
  const cat = document.querySelector('input[name="cat"]:checked')?.value || 'all';
  const priceRange = document.querySelector('input[name="price"]:checked')?.value || 'all';
  const sortBy = document.getElementById('sortBy')?.value || 'default';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  let results = getProductsByCategory(cat);

  if (search) {
    results = results.filter(p => p.name.toLowerCase().includes(search) || p.category.includes(search));
  }

  if (priceRange !== 'all') {
    const [min, max] = priceRange.split('-').map(Number);
    results = results.filter(p => p.price >= min && p.price <= max);
  }

  if (sortBy === 'price-low') results.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-high') results.sort((a, b) => b.price - a.price);
  else if (sortBy === 'name') results.sort((a, b) => a.name.localeCompare(b.name));

  const catNames = { all: 'All Products', mugs: 'Custom Mugs', tshirts: 'T-Shirts', gifts: 'Gifts', nameplate: 'Name Plates', spiritual: 'Spiritual Items' };
  const title = document.getElementById('pageTitle');
  const count = document.getElementById('productCount');
  if (title) title.textContent = catNames[cat] || 'All Products';
  if (count) count.textContent = `${results.length} products found`;

  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (!results.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#666"><i class="fa-solid fa-box-open" style="font-size:48px;margin-bottom:16px;display:block"></i>No products found</div>`;
    return;
  }
  grid.innerHTML = results.map(p => `
    <div class="product-card" onclick="window.location='product-detail.html?id=${p.id}'">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${p.image ? `<img src="${p.image}" alt="${p.name}" class="product-image" />` : `<i class="fa-solid ${p.icon}"></i>`}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span class="price-current">₹${p.price}</span>
          <span class="price-original">₹${p.originalPrice}</span>
          <span class="price-discount">${p.discount}% off</span>
        </div>
        <div class="product-rating">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))} <span style="color:#666">(${p.reviews})</span></div>
        <button class="btn-add-cart" onclick="event.stopPropagation();addToCart(${p.id})"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
      </div>
    </div>`).join('');
}
