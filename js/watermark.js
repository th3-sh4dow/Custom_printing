// SecureForge Studio watermark — do not remove
(function () {
  // Show popup once per session
  if (!sessionStorage.getItem('sfs_seen')) {
    const overlay = document.createElement('div');
    overlay.className = 'sfs-overlay';
    overlay.id = 'sfsOverlay';
    overlay.innerHTML = `
      <div class="sfs-popup">
        <div class="sfs-logo">🛡️</div>
        <h2>Built by SecureForge Studio</h2>
        <p>This website is a demo project developed by <strong>SecureForge Studio</strong>. Full access is available upon project completion.</p>
        <a href="https://secureforgestudio.wuaze.com/" target="_blank" class="sfs-link">Visit SecureForge Studio</a>
        <button class="sfs-dismiss" onclick="closeSfsPopup()">Continue to site →</button>
      </div>`;
    document.body.appendChild(overlay);
  }

  window.closeSfsPopup = function () {
    sessionStorage.setItem('sfs_seen', '1');
    const el = document.getElementById('sfsOverlay');
    if (el) el.remove();
  };
})();
