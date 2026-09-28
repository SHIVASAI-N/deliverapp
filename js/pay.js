// Payment: Razorpay real if key present, else demo UPI/Card/Wallet/COD
(function(){
  function loadRzp(){ return new Promise((res,rej)=>{ if(window.Razorpay) return res(true);
    const s=document.createElement('script'); s.src='https://checkout.razorpay.com/v1/checkout.js'; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.appendChild(s); }); }

  window.payNow = async function({amount, orderId, name}){
    const key = (window.DELIVERAPP_CONFIG?.RAZORPAY_KEY_ID||'').trim();
    const mode = document.querySelector('input[name=paymode]:checked')?.value || 'upi';
    if(mode==='cod'){ return {ok:true, mode:'COD', id:'COD-'+Date.now()}; }
    if(!key){
      // Demo success (no key pasted yet)
      await new Promise(r=>setTimeout(r,1200));
      return {ok:true, mode:mode+' (demo)', id:'DEMO-'+Math.floor(Math.random()*1e6)};
    }
    const ok = await loadRzp();
    if(!ok || !window.Razorpay){ await new Promise(r=>setTimeout(r,1200)); return {ok:true, mode:mode+' (demo)', id:'DEMO-'+Date.now()}; }
    return new Promise((resolve)=>{
      try{
        const rzp = new Razorpay({
          key, amount: Math.round(amount*100), currency:'INR',
          name: name||'DeliverApp • Epicurean', description:'Food order '+(orderId||''),
          theme:{color:'#a83211'},
          handler: (resp)=>resolve({ok:true, mode:'Razorpay:'+mode, id:resp.razorpay_payment_id}),
          modal:{ondismiss:()=>resolve({ok:false, reason:'cancelled'})}
        });
        rzp.on('payment.failed', ()=>resolve({ok:false, reason:'failed'}));
        rzp.open();
      }catch(e){ resolve({ok:false, reason:String(e)}); }
    });
  };
})();
