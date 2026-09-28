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
      document.querySelectorAll('[data-cart-badge], .cart-badge-count, #cartBadge, #standaloneCartBadge').forEach(el => {
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

    function injectStandaloneNavbar(){
      // Only inject if opened directly as a standalone page (outside the app.html iframe)
      if (window.parent !== window) return;
      const path = window.location.pathname;
      if (!path.includes('/screens/') || path.includes('login.html')) return;
      if (document.getElementById('standaloneBottomNav')) return;

      const nav = document.createElement('nav');
      nav.id = 'standaloneBottomNav';
      nav.className = 'standalone-mobile-nav';
      nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:rgba(12,10,9,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.12);padding:6px 12px max(env(safe-area-inset-bottom, 12px), 10px);display:flex;align-items:center;justify-content:space-around;touch-action:manipulation;box-shadow:0 -8px 28px rgba(0,0,0,0.6);font-family:"Plus Jakarta Sans",sans-serif;';

      const isHome = path.includes('home.html');
      const isRest = path.includes('restaurant.html');
      const isCart = path.includes('cart.html') || path.includes('checkout.html');
      const isTrack = path.includes('tracking.html') || path.includes('success.html');
      const isAcct = path.includes('account.html');
      const count = window.Cart ? window.Cart.count() : 0;

      nav.innerHTML = `
        <a href="/screens/home.html" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:${isHome ? '#fff' : 'rgba(255,255,255,0.6)'};padding:4px 0;transition:all 0.15s;">
          <div style="width:38px;height:30px;border-radius:12px;background:${isHome ? '#f04e23' : 'transparent'};display:flex;align-items:center;justify-content:center;margin-bottom:2px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#fff;">restaurant</span>
          </div>
          <span style="font-size:10px;font-weight:${isHome ? '700' : '500'};">Explore</span>
        </a>
        <a href="/screens/restaurant.html" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:${isRest ? '#fff' : 'rgba(255,255,255,0.6)'};padding:4px 0;transition:all 0.15s;">
          <div style="width:38px;height:30px;border-radius:12px;background:${isRest ? '#f04e23' : 'transparent'};display:flex;align-items:center;justify-content:center;margin-bottom:2px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#fff;">storefront</span>
          </div>
          <span style="font-size:10px;font-weight:${isRest ? '700' : '500'};">Kitchen</span>
        </a>
        <a href="/screens/cart.html" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:${isCart ? '#fff' : 'rgba(255,255,255,0.6)'};padding:4px 0;position:relative;transition:all 0.15s;">
          <div style="width:38px;height:30px;border-radius:12px;background:${isCart ? '#f04e23' : 'transparent'};display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:2px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#fff;">shopping_bag</span>
            <span id="standaloneCartBadge" style="position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;padding:0 3px;border-radius:999px;background:#f04e23;color:#fff;font-size:9px;font-weight:900;display:${count > 0 ? 'flex' : 'none'};align-items:center;justify-content:center;border:1px solid #000;">${count}</span>
          </div>
          <span style="font-size:10px;font-weight:${isCart ? '700' : '500'};">Bag</span>
        </a>
        <a href="/screens/tracking.html" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:${isTrack ? '#fff' : 'rgba(255,255,255,0.6)'};padding:4px 0;transition:all 0.15s;">
          <div style="width:38px;height:30px;border-radius:12px;background:${isTrack ? '#f04e23' : 'transparent'};display:flex;align-items:center;justify-content:center;margin-bottom:2px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#fff;">receipt_long</span>
          </div>
          <span style="font-size:10px;font-weight:${isTrack ? '700' : '500'};">Orders</span>
        </a>
        <a href="/screens/account.html" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;color:${isAcct ? '#fff' : 'rgba(255,255,255,0.6)'};padding:4px 0;transition:all 0.15s;">
          <div style="width:38px;height:30px;border-radius:12px;background:${isAcct ? '#f04e23' : 'transparent'};display:flex;align-items:center;justify-content:center;margin-bottom:2px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#fff;">person</span>
          </div>
          <span style="font-size:10px;font-weight:${isAcct ? '700' : '500'};">Account</span>
        </a>
      `;

      document.body.appendChild(nav);
      document.body.style.paddingBottom = '88px';
    }

    injectStandaloneNavbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavHandlers);
  } else {
    initNavHandlers();
  }
})();
