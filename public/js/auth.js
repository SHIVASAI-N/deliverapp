// DeliverApp Auth - Google Sign-In (Google Identity Services) + local session.
// Setup: paste a Web OAuth Client ID (Google Cloud Console > APIs & Services >
// Credentials > Create Credentials > OAuth client ID > Web application).
// The current origin (e.g. http://localhost:5173) must be an Authorized origin.
(function(){
  var USER_KEY = 'deliverapp_user_v1';
  var GIS_SRC = 'https://accounts.google.com/gsi/client';
  var gisLoading = null;

  function read(){ try{ return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }catch(e){ return null; } }
  function write(u){
    if(u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
    try{ window.dispatchEvent(new Event('auth:change')); }catch(e){}
  }

  function loadGis(){
    if(window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve(true);
    if(gisLoading) return gisLoading;
    gisLoading = new Promise(function(res){
      var s = document.createElement('script');
      s.src = GIS_SRC; s.async = true; s.defer = true;
      s.onload = function(){ res(!!(window.google && window.google.accounts)); };
      s.onerror = function(){ res(false); };
      document.head.appendChild(s);
      setTimeout(function(){ res(!!(window.google && window.google.accounts)); }, 8000);
    });
    return gisLoading;
  }

  function decodeJwt(token){
    try{
      var base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while(base.length % 4) base += '=';
      return JSON.parse(atob(base));
    }catch(e){ return null; }
  }

  window.Auth = {
    user: function(){ return read(); },
    signedIn: function(){ return !!read(); },

    clientId: function(){
      return (window.DELIVERAPP_CONFIG && window.DELIVERAPP_CONFIG.GOOGLE_CLIENT_ID) || '';
    },

    // Initialise Google Sign-In. Resolves true when the real button can render.
    initGoogle: async function(){
      var cid = (this.clientId() || '').trim();
      if(!cid) return false;
      var ok = await loadGis();
      if(!ok || !window.google.accounts.id) return false;
      try{
        window.google.accounts.id.initialize({
          client_id: cid,
          callback: window.Auth.handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        return true;
      }catch(e){ return false; }
    },

    // Render the official Google button into an element (by id or node).
    renderButton: async function(target, opts){
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if(!el) return false;
      var ready = await this.initGoogle();
      if(!ready) return false;
      try{
        el.innerHTML = '';
        window.google.accounts.id.renderButton(el, Object.assign(
          { theme: 'outline', size: 'large', width: 280, text: 'signin_with', shape: 'pill' },
          opts || {}
        ));
        return true;
      }catch(e){ return false; }
    },

    handleCredential: function(resp){
      var claims = decodeJwt(resp && resp.credential || '');
      if(!claims || !claims.email) {
        if(window.toast) toast('Google sign-in failed — try again');
        return;
      }
      write({
        name: claims.name || claims.email.split('@')[0],
        email: claims.email,
        picture: claims.picture || '',
        provider: 'google',
        signedInAt: Date.now()
      });
      if(window.toast) toast('Welcome, ' + (claims.given_name || claims.name || 'foodie'));
    },

    // Demo fallback so the ordering flow can be tried with no Client ID.
    signInDemo: function(){
      write({ name: 'Guest Foodie', email: 'guest@deliverapp.local', picture: '', provider: 'demo', signedInAt: Date.now() });
      if(window.toast) toast('Continuing as guest');
    },

    signOut: function(){
      var u = read();
      try{
        if(u && u.provider === 'google' && window.google && window.google.accounts &&
           window.google.accounts.id && u.email){
          window.google.accounts.id.revoke(u.email, function(){});
        }
      }catch(e){}
      try{ if(window.google && window.google.accounts) window.google.accounts.id.disableAutoSelect(); }catch(e){}
      write(null);
      if(window.toast) toast('Signed out');
    }
  };
})();
