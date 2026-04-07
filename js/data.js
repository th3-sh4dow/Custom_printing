// ===== PRODUCT DATA (API-backed with local fallback cache) =====
let PRODUCTS = [];
let _productsLoaded = false;
let _loadCallbacks = [];

async function loadProductsFromAPI() {
  if (_productsLoaded) return PRODUCTS;
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      PRODUCTS = await res.json();
      _productsLoaded = true;
    }
  } catch {
    // server not running — keep PRODUCTS empty, pages handle gracefully
  }
  _loadCallbacks.forEach(fn => fn(PRODUCTS));
  _loadCallbacks = [];
  return PRODUCTS;
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === parseInt(id)) || null;
}

function getProductsByCategory(cat) {
  if (!cat || cat === 'all') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === cat);
}

// Auto-load on script parse
loadProductsFromAPI();
