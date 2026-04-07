const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'cph_admin_secret_2026';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('.'));                          // serve frontend files
app.use('/uploads', express.static('uploads'));

// ── Multer (design uploads) ─────────────────────────────────────────────────
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Database ────────────────────────────────────────────────────────────────
const db = new Database('shop.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    originalPrice INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    icon TEXT DEFAULT 'fa-box',
    badge TEXT DEFAULT '',
    description TEXT DEFAULT '',
    features TEXT DEFAULT '[]',
    inStock INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL,
    payment TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS design_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    product TEXT NOT NULL,
    qty INTEGER DEFAULT 1,
    notes TEXT DEFAULT '',
    imageFile TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    createdAt TEXT NOT NULL
  );
`);

// Seed default admin
const adminExists = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hash);
}

// Seed products from JS data if table is empty
const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (productCount === 0) {
  const seed = [
    { name: "Custom Photo Mug", category: "mugs", price: 299, originalPrice: 499, discount: 40, rating: 4.5, reviews: 128, image: "images/product-1.png", icon: "fa-mug-hot", badge: "Bestseller", description: "High-quality ceramic mug with your custom photo or design.", features: JSON.stringify(["11oz ceramic mug","Dishwasher safe","Vibrant print quality","Custom photo/text","Free delivery above ₹499"]) },
    { name: "Magic Color Changing Mug", category: "mugs", price: 399, originalPrice: 599, discount: 33, rating: 4.3, reviews: 89, image: "images/product-2.png", icon: "fa-mug-hot", badge: "Popular", description: "Heat-sensitive mug that reveals your design when filled with hot liquid.", features: JSON.stringify(["11oz magic mug","Heat-sensitive coating","Custom design","Great gift idea","Microwave safe"]) },
    { name: "Custom Printed T-Shirt", category: "tshirts", price: 449, originalPrice: 699, discount: 36, rating: 4.6, reviews: 215, image: "images/product-3.png", icon: "fa-shirt", badge: "New", description: "Premium quality cotton t-shirt with your custom design.", features: JSON.stringify(["100% cotton","Available S-XXL","Vibrant DTF print","Washable design","Unisex fit"]) },
    { name: "Polo T-Shirt Custom Print", category: "tshirts", price: 599, originalPrice: 899, discount: 33, rating: 4.4, reviews: 67, image: "images/product-4.png", icon: "fa-shirt", badge: "", description: "Premium polo t-shirt with custom embroidery or print.", features: JSON.stringify(["Premium polo fabric","Custom logo/text","Corporate gifting","Available all sizes","Bulk discounts available"]) },
    { name: "Custom Home Name Plate", category: "nameplate", price: 349, originalPrice: 549, discount: 36, rating: 4.7, reviews: 312, image: "images/product-5.png", icon: "fa-house", badge: "Trending", description: "Beautiful customized name plate for your home.", features: JSON.stringify(["Acrylic/Wood material","Custom name & design","Weather resistant","Easy installation","Multiple sizes"]) },
    { name: "Office Desk Name Plate", category: "nameplate", price: 299, originalPrice: 449, discount: 33, rating: 4.5, reviews: 98, image: "images/product-6.png", icon: "fa-briefcase", badge: "", description: "Professional desk name plate for office use.", features: JSON.stringify(["Premium acrylic","Custom name & title","Elegant design","Multiple colors","Corporate gifting"]) },
    { name: "Custom Photo Frame", category: "gifts", price: 399, originalPrice: 599, discount: 33, rating: 4.6, reviews: 178, image: "images/product-7.png", icon: "fa-image", badge: "Gift", description: "Beautiful custom photo frame with your favorite memories.", features: JSON.stringify(["Premium wood/acrylic","Custom photo print","Multiple sizes","Gift packaging","Free personalization"]) },
    { name: "Custom Cushion Cover", category: "gifts", price: 349, originalPrice: 499, discount: 30, rating: 4.4, reviews: 134, image: "images/product-8.png", icon: "fa-couch", badge: "", description: "Soft cushion cover with your custom photo or design.", features: JSON.stringify(["Soft polyester","Custom photo print","16x16 inch","Zipper closure","Washable"]) },
    { name: "Spiritual Om Name Plate", category: "spiritual", price: 449, originalPrice: 649, discount: 31, rating: 4.8, reviews: 256, image: "images/product-9.png", icon: "fa-om", badge: "Divine", description: "Beautiful spiritual name plate with Om symbol.", features: JSON.stringify(["Premium material","Om symbol design","Custom name","Vastu friendly","Auspicious gifting"]) },
    { name: "Custom Spiritual Amulet", category: "spiritual", price: 249, originalPrice: 399, discount: 38, rating: 4.5, reviews: 89, image: "images/product-10.png", icon: "fa-star-and-crescent", badge: "", description: "Personalized spiritual amulet with custom engraving.", features: JSON.stringify(["Premium metal","Custom engraving","Spiritual design","Gift packaging","Blessed item"]) },
    { name: "Custom Keychain", category: "gifts", price: 199, originalPrice: 299, discount: 33, rating: 4.3, reviews: 445, image: "images/product-11.png", icon: "fa-key", badge: "Budget", description: "Personalized keychain with your photo, name or custom design.", features: JSON.stringify(["Metal/acrylic","Custom photo/text","Durable print","Compact size","Bulk orders available"]) },
    { name: "Custom Water Bottle", category: "gifts", price: 499, originalPrice: 799, discount: 38, rating: 4.5, reviews: 167, image: "images/product-12.png", icon: "fa-bottle-water", badge: "", description: "Stainless steel water bottle with custom design.", features: JSON.stringify(["Stainless steel","Custom print/logo","500ml capacity","Leak-proof","Corporate gifting"]) },
  ];
  const ins = db.prepare('INSERT INTO products (name,category,price,originalPrice,discount,rating,reviews,image,icon,badge,description,features) VALUES (@name,@category,@price,@originalPrice,@discount,@rating,@reviews,@image,@icon,@badge,@description,@features)');
  seed.forEach(p => ins.run(p));
}

// ── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════════════════

// GET all products (for frontend)
app.get('/api/products', (req, res) => {
  const { cat } = req.query;
  const rows = cat && cat !== 'all'
    ? db.prepare('SELECT * FROM products WHERE category = ? AND inStock = 1').all(cat)
    : db.prepare('SELECT * FROM products WHERE inStock = 1').all();
  res.json(rows.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ ...p, features: JSON.parse(p.features || '[]') });
});

// POST place order
app.post('/api/orders', (req, res) => {
  const { name, phone, email, address, city, state, pincode, items, subtotal, shipping, total, payment, notes } = req.body;
  if (!name || !phone || !address || !city || !state || !pincode || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const orderId = 'CPH' + Date.now();
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO orders (orderId,name,phone,email,address,city,state,pincode,items,subtotal,shipping,total,payment,notes,createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(orderId, name, phone, email || '', address, city, state, pincode, JSON.stringify(items), subtotal, shipping, total, payment, notes || '', createdAt);
  res.json({ success: true, orderId });
});

// POST design upload request
app.post('/api/design-requests', upload.single('image'), (req, res) => {
  const { name, phone, product, qty, notes } = req.body;
  if (!name || !phone || !product) return res.status(400).json({ error: 'Missing fields' });
  const imageFile = req.file ? req.file.filename : '';
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO design_requests (name,phone,product,qty,notes,imageFile,createdAt) VALUES (?,?,?,?,?,?,?)')
    .run(name, phone, product, qty || 1, notes || '', imageFile, createdAt);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN API (protected)
// ══════════════════════════════════════════════════════════════════════════════

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: admin.username });
});

// Dashboard stats
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalRevenue = db.prepare("SELECT SUM(total) as s FROM orders WHERE status != 'cancelled'").get().s || 0;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const designRequests = db.prepare('SELECT COUNT(*) as c FROM design_requests').get().c;
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC LIMIT 5').all()
    .map(o => ({ ...o, items: JSON.parse(o.items) }));
  res.json({ totalOrders, totalRevenue, pendingOrders, totalProducts, designRequests, recentOrders });
});

// ── Orders ──────────────────────────────────────────────────────────────────
app.get('/api/admin/orders', authMiddleware, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];
  if (status && status !== 'all') { conditions.push('status = ?'); params.push(status); }
  if (search) { conditions.push('(name LIKE ? OR phone LIKE ? OR orderId LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY createdAt DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items) })));
});

app.patch('/api/admin/orders/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/orders/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Products ────────────────────────────────────────────────────────────────
app.get('/api/admin/products', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(rows.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
});

app.post('/api/admin/products', authMiddleware, upload.single('image'), (req, res) => {
  const { name, category, price, originalPrice, discount, rating, reviews, icon, badge, description, features, inStock } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : (req.body.image || '');
  const featuresJson = Array.isArray(features) ? JSON.stringify(features) : (features || '[]');
  const result = db.prepare(`INSERT INTO products (name,category,price,originalPrice,discount,rating,reviews,image,icon,badge,description,features,inStock)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(name, category, price, originalPrice, discount || 0, rating || 4.5, reviews || 0, image, icon || 'fa-box', badge || '', description || '', featuresJson, inStock !== '0' ? 1 : 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/products/:id', authMiddleware, upload.single('image'), (req, res) => {
  const { name, category, price, originalPrice, discount, rating, reviews, icon, badge, description, features, inStock } = req.body;
  const existing = db.prepare('SELECT image FROM products WHERE id = ?').get(req.params.id);
  const image = req.file ? `uploads/${req.file.filename}` : (req.body.image || existing?.image || '');
  const featuresJson = Array.isArray(features) ? JSON.stringify(features) : (features || '[]');
  db.prepare(`UPDATE products SET name=?,category=?,price=?,originalPrice=?,discount=?,rating=?,reviews=?,image=?,icon=?,badge=?,description=?,features=?,inStock=? WHERE id=?`)
    .run(name, category, price, originalPrice, discount || 0, rating || 4.5, reviews || 0, image, icon || 'fa-box', badge || '', description || '', featuresJson, inStock !== '0' ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/products/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Design Requests ─────────────────────────────────────────────────────────
app.get('/api/admin/design-requests', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM design_requests ORDER BY createdAt DESC').all();
  res.json(rows);
});

app.patch('/api/admin/design-requests/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE design_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ── Admin password change ────────────────────────────────────────────────────
app.post('/api/admin/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(400).json({ error: 'Current password is wrong' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, req.admin.id);
  res.json({ success: true });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Custom Printing Hub server running at http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`   Username: admin | Password: admin123\n`);
});
