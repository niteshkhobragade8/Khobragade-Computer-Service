let deferredPrompt=null;
const btn=document.getElementById('installAdminApp');
if(btn)btn.disabled=true;

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./admin-sw.js',{updateViaCache:'none'})
    .then(reg=>reg.update().catch(()=>{}))
    .catch(console.warn);
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  if(btn)btn.disabled=false;
});
btn?.addEventListener('click',async()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    btn.disabled=true;
  }else{
    alert('Chrome menu → Add to Home screen / Install app use karein.');
  }
});
