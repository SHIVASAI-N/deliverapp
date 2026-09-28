/**
 * DeliverApp — OpenStreetMap (OSM) & Live Geolocation Engine
 * Configured for User Live Location: Kompally, Hyderabad (17.55714, 78.44987)
 * Features: Border box with exit map controls, scroll-trap prevention,
 * 1.5 km surrounding delivery radius visualization, and courier route telemetry.
 */
(function() {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.L) return resolve(window.L);
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (window.L) return resolve(window.L);
        existing.addEventListener('load', () => resolve(window.L));
        existing.addEventListener('error', reject);
        setTimeout(() => {
          if (window.L) resolve(window.L);
          else reject(new Error('Leaflet load timeout'));
        }, 1500);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve(window.L);
      s.onerror = reject;
      document.head.appendChild(s);
      setTimeout(() => {
        if (window.L) resolve(window.L);
        else reject(new Error('Leaflet load timeout'));
      }, 3000);
    });
  }

  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  // Exact coordinates requested by user:
  // 1. Google Maps: https://www.google.com/maps/place/Maisammaguda,+Dulapally,+Hyderabad,+Telangana+500100/@17.5606021,78.4492492,2186m
  // 2. OpenStreetMap: https://www.openstreetmap.org/edit#map=14/17.55714/78.44987
  const MAISAMMAGUDA_DULAPALLY_COORDS = {
    lat: 17.5630979,
    lng: 78.4553013,
    label: 'Maisammaguda, Dulapally, Hyderabad 500100'
  };

  const HYDERABAD_KOMPALLY_COORDS = MAISAMMAGUDA_DULAPALLY_COORDS;

  // Reverse geocode lat/lng using OpenStreetMap Nominatim
  async function reverseGeocodeOSM(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || 'Kompally Main Road';
        const area = addr.neighbourhood || addr.suburb || addr.city_district || 'Kompally';
        const city = addr.city || addr.town || addr.county || 'Hyderabad';
        const postcode = addr.postcode || '500100';

        const fullLabel = `${road}, ${area}`;
        const detailed = `${road}, ${area}, ${city} ${postcode}`.trim();

        // Update stored delivery address
        if (window.DeliveryAddress) {
          window.DeliveryAddress.save({
            label: fullLabel,
            house: road,
            street: road,
            area: area,
            city: `${city} ${postcode}`.trim(),
            tag: 'Live GPS',
            phone: '+91 98470 88990',
            latitude: lat,
            longitude: lng
          });
        }
        return { road, area, city, detailed };
      }
    } catch (e) {
      console.warn('[OSM Nominatim] Geocode fetch failed, using Kompally coordinate fallback:', e);
    }
    return {
      road: 'Kompally Main Road',
      area: 'Kompally',
      city: 'Hyderabad 500100',
      detailed: 'Kompally Main Road, Hyderabad 500100 (17.55714, 78.44987)'
    };
  }

  // Global helper to request and lock to user's real geolocation
  window.detectCurrentLocation = function(onSuccess, onError) {
    if (!navigator.geolocation) {
      if (onError) onError(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        localStorage.setItem('deliverapp_user_coords', JSON.stringify(coords));
        window.DELIVERAPP_CONFIG = window.DELIVERAPP_CONFIG || {};
        window.DELIVERAPP_CONFIG.CUSTOMER_POS = {
          lat: coords.lat,
          lng: coords.lng,
          label: 'My Current Location'
        };

        const geo = await reverseGeocodeOSM(coords.lat, coords.lng);
        window.dispatchEvent(new CustomEvent('deliverapp:location_updated', {
          detail: { coords, geo }
        }));

        if (onSuccess) onSuccess(coords, geo);
      },
      (err) => {
        console.warn('[Geolocation] User denied or error occurred, keeping Kompally default:', err.message);
        if (onError) onError(err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  /**
   * Initialize OpenStreetMap with surrounding area radius, user pin, restaurant,
   * animated courier, border box controls, and exit map buttons.
   */
  window.initTrackingMap = async function(opts) {
    opts = opts || {};
    const mountId = opts.mountId || 'liveMap';
    const mount = document.getElementById(mountId);
    if (!mount) return null;

    if (mount._map) {
      try {
        mount._map.invalidateSize();
        return mount._map;
      } catch(e) {
        try { mount._map.remove(); } catch(err){}
        mount._map = null;
      }
    }

    if (mount._leaflet_id) {
      try {
        delete mount._leaflet_id;
      } catch(e) {
        mount._leaflet_id = null;
      }
    }

    // Determine user coordinates: prioritize user's Kompally Hyderabad location
    let savedCoords = null;
    try {
      savedCoords = JSON.parse(localStorage.getItem('deliverapp_user_coords') || 'null');
      // If old default Kochi (lat < 12) was saved, replace with Kompally, Hyderabad!
      if (savedCoords && savedCoords.lat < 12) {
        savedCoords = HYDERABAD_KOMPALLY_COORDS;
        localStorage.setItem('deliverapp_user_coords', JSON.stringify(savedCoords));
      }
    } catch(e) {}

    const cfg = window.DELIVERAPP_CONFIG || {};
    let customerPos = savedCoords || cfg.CUSTOMER_POS || MAISAMMAGUDA_DULAPALLY_COORDS;
    if (customerPos.lat < 12) customerPos = MAISAMMAGUDA_DULAPALLY_COORDS;

    // Dynamically retrieve active restaurant (Lazeez Arabian Mandi, My Village Kitchen, Royal Dawat, etc.)
    const activeRest = (window.getActiveRestaurant ? window.getActiveRestaurant() : null) || (window.RESTAURANT || null);
    let restaurantPos = {
      lat: (activeRest && activeRest.lat) ? activeRest.lat : (customerPos.lat + 0.0035),
      lng: (activeRest && activeRest.lng) ? activeRest.lng : (customerPos.lng - 0.0025),
      label: (activeRest && activeRest.name) ? activeRest.name : "Lazeez Arabian Mandi & Shawarma",
      address: (activeRest && activeRest.address) ? activeRest.address : "Maisammaguda, Dulapally 500100"
    };

    loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

    let L;
    try {
      L = await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    } catch (err) {
      console.warn('[Leaflet] CDN load failed, rendering fallback canvas', err);
      renderFallbackMap(mount, customerPos, restaurantPos);
      return null;
    }

    let map;
    try {
      mount.innerHTML = '';

      // Initialize Leaflet Map centered on user's Maisammaguda location with Zoom 14
      // scrollWheelZoom: false prevents scroll trap when user tries to scroll page!
      map = L.map(mountId, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        touchZoom: true
      }).setView([customerPos.lat, customerPos.lng], 14);

      mount._map = map;
      mount.dataset.loaded = '1';

      // Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Standard Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(map);
    } catch (mapErr) {
      console.warn('[Leaflet] L.map init error, rendering fallback canvas:', mapErr);
      renderFallbackMap(mount, customerPos, restaurantPos);
      return null;
    }

    // --- Custom Markers ---

    // 1. Surrounding Area Delivery Radius Circle (1.5 km radius around user)
    const surroundingRadius = L.circle([customerPos.lat, customerPos.lng], {
      radius: 1500,
      color: '#a83211',
      weight: 2,
      dashArray: '6, 8',
      fillColor: '#a83211',
      fillOpacity: 0.08
    }).addTo(map);

    // 2. User Location Marker (Green beacon with pulsing ring)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(0,107,44,0.35); animation:pulse 2s infinite;"></div>
          <div style="width:24px; height:24px; border-radius:50%; background:#006b2c; border:3px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px;">
            📍
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    const userMarker = L.marker([customerPos.lat, customerPos.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family:sans-serif; font-size:12px; line-height:1.4;">
        <b style="color:#006b2c">📍 Your Live Location</b><br/>
        <span>Maisammaguda, Dulapally 500100 (${customerPos.lat.toFixed(5)}°N, ${customerPos.lng.toFixed(5)}°E)</span><br/>
        <small style="color:#a83211; font-weight:bold;">1.5 km Surrounding Radius Active</small>
      </div>
    `).openPopup();

    // 3. Restaurant Marker
    const restEmoji = restaurantPos.label.includes('Mandi') ? '🍗' :
                      restaurantPos.label.includes('Village') ? '🍲' :
                      restaurantPos.label.includes('Bakery') ? '🍔' : '🍕';
    const restIcon = L.divIcon({
      className: 'custom-rest-marker',
      html: `
        <div style="width:32px; height:32px; border-radius:50%; background:#835500; border:2px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:15px;">
          ${restEmoji}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const restMarker = L.marker([restaurantPos.lat, restaurantPos.lng], { icon: restIcon }).addTo(map);
    restMarker.bindPopup(`<b>${restEmoji} ${restaurantPos.label}</b><br/><small>${restaurantPos.address}</small>`);

    // 4. Courier Marker (Julian on Electric Vespa)
    const midLat = (restaurantPos.lat + customerPos.lat) / 2;
    const midLng = (restaurantPos.lng + customerPos.lng) / 2;
    const riderIcon = L.divIcon({
      className: 'custom-rider-marker',
      html: `
        <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(168,50,17,0.35); animation:pulse 1.5s infinite;"></div>
          <div style="width:28px; height:28px; border-radius:50%; background:#a83211; border:2.5px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; font-size:14px;">
            🛵
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    const riderMarker = L.marker([midLat, midLng], { icon: riderIcon }).addTo(map);
    riderMarker.bindPopup(`<b>Rahul (Delivery Partner)</b><br/><small>★ 4.8 • Electric Scooter • Out for Delivery in Maisammaguda & Dulapally</small>`);

    // 5. Route Polyline
    const routePoints = [
      [restaurantPos.lat, restaurantPos.lng],
      [midLat + 0.001, midLng - 0.001],
      [customerPos.lat, customerPos.lng]
    ];
    const routeLine = L.polyline(routePoints, {
      color: '#a83211',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map);

    // Keep surrounding area centered (Zoom 14 matches user specification)
    function lockToSurroundings() {
      map.setView([customerPos.lat, customerPos.lng], 14, { animate: true });
    }

    // Fit entire route bounds
    function fitFullRadar() {
      const bounds = L.latLngBounds([
        [restaurantPos.lat, restaurantPos.lng],
        [customerPos.lat, customerPos.lng],
        riderMarker.getLatLng()
      ]).pad(0.2);
      map.fitBounds(bounds, { animate: true });
    }

    // Exit Map function: smoothly scrolls down to order details cards
    function exitMapToDetails() {
      const detailsSection = document.getElementById('orderDetailsSection');
      if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollBy({ top: 340, behavior: 'smooth' });
      }
    }

    // Wire all exit map & scroll buttons
    document.getElementById('btnExitMap')?.addEventListener('click', exitMapToDetails);
    document.getElementById('btnFloatingExitMap')?.addEventListener('click', exitMapToDetails);
    document.getElementById('btnScrollToReceipt')?.addEventListener('click', exitMapToDetails);
    document.getElementById('btnKeepSurroundings')?.addEventListener('click', lockToSurroundings);
    document.getElementById('btnFitRadar')?.addEventListener('click', fitFullRadar);

    // Toggle map height / collapse to allow exiting map visually
    const toggleBtn = document.getElementById('btnToggleMapHeight');
    const viewport = document.getElementById('mapViewport');
    const icon = document.getElementById('mapToggleIcon');
    let isCollapsed = false;
    toggleBtn?.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      if (viewport) {
        viewport.style.height = isCollapsed ? '72px' : '320px';
      }
      if (icon) {
        icon.textContent = isCollapsed ? 'expand_more' : 'expand_less';
      }
      setTimeout(() => {
        try { map.invalidateSize(); } catch(e) {}
      }, 320);
    });

    // Handle Live Location Detection & Update
    const detectBtn = document.getElementById('btnDetectGPS');
    const updateLocation = () => {
      const textEl = document.getElementById('gpsBtnText');
      if (textEl) textEl.textContent = 'Locating...';

      window.detectCurrentLocation((coords, geo) => {
        customerPos = { lat: coords.lat, lng: coords.lng, label: geo.detailed };
        userMarker.setLatLng([coords.lat, coords.lng]);
        surroundingRadius.setLatLng([coords.lat, coords.lng]);

        // Reposition restaurant dynamically in user's surrounding area
        restaurantPos = {
          lat: coords.lat + 0.0074,
          lng: coords.lng + 0.0071,
          label: "Forno d'Oro Trattoria"
        };
        restMarker.setLatLng([restaurantPos.lat, restaurantPos.lng]);

        // Recompute route to user
        const newMidLat = (restaurantPos.lat + coords.lat) / 2;
        const newMidLng = (restaurantPos.lng + coords.lng) / 2;
        riderMarker.setLatLng([newMidLat, newMidLng]);
        routeLine.setLatLngs([
          [restaurantPos.lat, restaurantPos.lng],
          [newMidLat + 0.001, newMidLng - 0.001],
          [coords.lat, coords.lng]
        ]);

        lockToSurroundings();

        if (textEl) textEl.textContent = '📍 GPS Locked';

        const addrEl = document.getElementById('customerAddrText');
        if (addrEl) addrEl.textContent = geo.detailed;
        const popupText = document.getElementById('popupAddrText');
        if (popupText) popupText.textContent = geo.detailed;
      }, (err) => {
        if (textEl) textEl.textContent = 'GPS Default';
        console.warn('GPS permission denied or unavailable:', err);
      });
    };

    detectBtn?.addEventListener('click', updateLocation);

    // Initial lock to Kompally surroundings
    lockToSurroundings();

    // --- Live Courier Gliding Animation ---
    let progress = 0.45;
    setInterval(() => {
      progress += 0.008;
      if (progress > 0.98) progress = 0.2; // loop route

      const lat = restaurantPos.lat + (customerPos.lat - restaurantPos.lat) * progress;
      const lng = restaurantPos.lng + (customerPos.lng - restaurantPos.lng) * progress;
      riderMarker.setLatLng([lat, lng]);

      const etaMins = Math.max(1, Math.round((1 - progress) * 16));
      const etaCard = document.getElementById('etaMinutesText');
      if (etaCard) etaCard.textContent = `${etaMins} Minutes`;

      const etaSub = document.getElementById('etaSubText');
      if (etaSub) etaSub.textContent = `Julian is ${((1 - progress) * 1.8).toFixed(1)} km away navigating Kompally surroundings`;
    }, 1500);

    setTimeout(() => {
      try { map.invalidateSize(); } catch(e) {}
    }, 300);

    mount.dataset.loaded = '1';
    mount._map = map;
    return map;
  };

  function renderFallbackMap(mount, customerPos, restaurantPos) {
    mount.innerHTML = `
      <div style="width:100%; height:100%; background:#f4ece8; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; inset:0; background:radial-gradient(#e0d8d5 1px, transparent 1px); background-size:16px 16px; opacity:0.6;"></div>
        <div style="text-align:center; z-index:10; padding:16px;">
          <div style="font-size:28px; margin-bottom:4px;">🗺️</div>
          <b style="font-size:13px; color:#1e1b19">OpenStreetMap Surroundings (Kompally, Hyderabad)</b><br/>
          <span style="font-size:11px; color:#59413b">Target: ${customerPos.lat.toFixed(5)}, ${customerPos.lng.toFixed(5)}</span><br/>
          <div style="margin-top:8px; display:inline-block; padding:4px 10px; border-radius:12px; background:#a83211; color:#fff; font-size:11px; font-weight:bold;">
            🛵 Courier Julian En Route
          </div>
        </div>
      </div>
    `;
  }
})();
