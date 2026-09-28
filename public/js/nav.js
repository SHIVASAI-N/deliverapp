// Universal Navigation & Cross-Frame Coordinator for DeliverApp (Epicurean Curations)
(function(){
  const HASH_MAP = {
    'home': '#/home',
    'restaurant': '#/restaurant',
    'cart': '#/cart',
    'bag': '#/cart',
    'checkout': '#/checkout',
    'tracking': '#/tracking',
    'orders': '#/tracking',
    'order': '#/tracking',
    'success': '#/success',
    'account': '#/account',
    'profile': '#/account',
    'login': '#/login',
    'signin': '#/login',
    'signup': '#/login'
  };

  const FILE_MAP = {
    'home': '/screens/home.html',
    'restaurant': '/screens/restaurant.html',
    'cart': '/screens/cart.html',
    'bag': '/screens/cart.html',
    'checkout': '/screens/checkout.html',
    'tracking': '/screens/tracking.html',
    'orders': '/screens/tracking.html',
    'order': '/screens/tracking.html',
    'success': '/screens/success.html',
    'account': '/screens/account.html',
    'profile': '/screens/account.html',
    'login': '/screens/login.html',
    'signin': '/screens/login.html',
    'signup': '/screens/login.html'
  };

  window.navigateTo = function(target){
    if (!target) return;
    const clean = target.replace(/^#\/?/, '').replace(/^\/screens\//, '').replace(/\.html$/, '');
    const h = HASH_MAP[clean] || target;
    const f = FILE_MAP[clean] || (target.startsWith('/') ? target : '/screens/' + target + '.html');

    if (window.parent && window.parent !== window && typeof window.parent.go === 'function') {
      window.parent.go(h);
    } else if (window.location.pathname.includes('app.html')) {
      window.location.hash = h;
    } else {
      window.location.href = f;
    }
  };

  function initNavHandlers(){
    document.querySelectorAll('[data-path], [data-nav], [data-go]').forEach(el => {
      const path = el.getAttribute('data-path') || el.getAttribute('data-nav') || el.getAttribute('data-go');
      if (path && !el.dataset.navBound) {
        el.dataset.navBound = 'true';
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          if (el.tagName === 'A' && el.getAttribute('href') && !el.getAttribute('href').startsWith('#')) {
            return; // Let standard links handle if needed
          }
          e.preventDefault();
          window.navigateTo(path);
        });
      }
    });

    function syncBadges(){
      const count = window.Cart ? window.Cart.count() : 0;
      document.querySelectorAll('[data-cart-badge], .cart-badge-count, #cartBadge').forEach(el => {
        el.textContent = count;
        if (count > 0) {
          el.style.display = 'flex';
          el.classList.remove('hidden');
        } else {
          el.style.display = 'none';
          el.classList.add('hidden');
        }
      });
    }

    syncBadges();
    window.addEventListener('cart:update', syncBadges);
    window.addEventListener('storage', syncBadges);
    window.addEventListener('pageshow', syncBadges);
    window.addEventListener('focus', syncBadges);
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'cart:update') syncBadges();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavHandlers);
  } else {
    initNavHandlers();
  }
})();
