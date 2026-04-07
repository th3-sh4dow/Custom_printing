// ===== HOME PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromAPI();
  renderFeaturedProducts();
  startBannerSlider();
});

function renderFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  const featured = PRODUCTS.slice(0, 8);
  container.innerHTML = featured.map(renderProductCard).join('');
}

function renderProductCard(p) {
  return `
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
        <div class="product-rating">
          ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
          <span style="color:#666">(${p.reviews})</span>
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${p.id})">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>`;
}

// Banner Slider
let currentSlide = 0;
function startBannerSlider() {
  setInterval(() => {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    goSlide((currentSlide + 1) % slides.length);
  }, 3500);
}

function goSlide(n) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  currentSlide = n;
  slides[currentSlide].classList.add('active');
  dots[currentSlide]?.classList.add('active');
}
