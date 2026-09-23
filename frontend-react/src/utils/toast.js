export function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  
  // Start hidden
  el.style.transform = 'translateY(100%)';
  el.style.opacity = '0';
  el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });
  });

  // Remove after 3s
  setTimeout(() => {
    el.style.transform = 'translateY(100%)';
    el.style.opacity = '0';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }, 3000);
}
