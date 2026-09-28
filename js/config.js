// DeliverApp shared config - paste keys once, works on mobile too (localStorage override)
window.DELIVERAPP_CONFIG = {
  // Paste in UI (account Settings) or here:
  GOOGLE_MAPS_API_KEY: localStorage.getItem('deliverapp_gmaps_key') || '',
  RAZORPAY_KEY_ID: localStorage.getItem('deliverapp_rzp_key') || '',
  GOOGLE_CLIENT_ID: localStorage.getItem('deliverapp_google_cid') || '',
  // Live user location & surroundings: Kompally, Hyderabad (17.55714, 78.44987)
  DEFAULT_CENTER: { lat: 17.55714, lng: 78.44987, label: 'Kompally, Hyderabad' },
  RESTAURANT_POS: { lat: 17.56450, lng: 78.45700, label: "Forno d'Oro Trattoria (Kompally)" },
  CUSTOMER_POS: { lat: 17.55714, lng: 78.44987, label: 'Current Location • Kompally, Hyderabad' },
  BACKEND_URL: localStorage.getItem('deliverapp_backend_url') || 'http://localhost:5000',
};
function saveDeliverKeys(gmapsKey, rzpKey, googleCid) {
  if (gmapsKey !== undefined) localStorage.setItem('deliverapp_gmaps_key', (gmapsKey||'').trim());
  if (rzpKey !== undefined) localStorage.setItem('deliverapp_rzp_key', (rzpKey||'').trim());
  if (googleCid !== undefined) localStorage.setItem('deliverapp_google_cid', (googleCid||'').trim());
  window.DELIVERAPP_CONFIG.GOOGLE_MAPS_API_KEY = localStorage.getItem('deliverapp_gmaps_key') || '';
  window.DELIVERAPP_CONFIG.RAZORPAY_KEY_ID = localStorage.getItem('deliverapp_rzp_key') || '';
  window.DELIVERAPP_CONFIG.GOOGLE_CLIENT_ID = localStorage.getItem('deliverapp_google_cid') || '';
}
