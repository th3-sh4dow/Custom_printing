// ===== UPLOAD DESIGN PAGE =====
const dropZone = document.getElementById('dropZone');

if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#1565C0'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
  });
}

function previewImage(event) {
  const file = event.target.files[0];
  if (file) showPreview(file);
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('dropZone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  document.getElementById('previewImg').src = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('dropZone').style.display = 'block';
  document.getElementById('fileInput').value = '';
}

async function submitUpload() {
  const name = document.getElementById('upName')?.value.trim();
  const phone = document.getElementById('upPhone')?.value.trim();
  const product = document.getElementById('upProduct')?.value;
  const qty = document.getElementById('upQty')?.value || 1;
  const notes = document.getElementById('upNotes')?.value.trim();

  if (!name || !phone || !product) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  // Try to save to backend
  try {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('phone', phone);
    fd.append('product', product);
    fd.append('qty', qty);
    fd.append('notes', notes || '');
    const imgFile = document.getElementById('fileInput')?.files[0];
    if (imgFile) fd.append('image', imgFile);
    await fetch('/api/design-requests', { method: 'POST', body: fd });
  } catch { /* server offline, still redirect to WhatsApp */ }

  const productNames = { mug: 'Custom Mug', tshirt: 'T-Shirt', nameplate: 'Name Plate', gift: 'Gift Item', spiritual: 'Spiritual Item', other: 'Other' };
  const msg = `Hi! I want to place a custom order on Custom Printing Hub.\n\nName: ${name}\nPhone: ${phone}\nProduct: ${productNames[product]}\nQuantity: ${qty}\n${notes ? 'Notes: ' + notes : ''}\n\nI will send my design image now.`;

  showToast('Redirecting to WhatsApp...', 'success');
  setTimeout(() => {
    window.open(`https://wa.me/919142927996?text=${encodeURIComponent(msg)}`, '_blank');
  }, 800);
}
