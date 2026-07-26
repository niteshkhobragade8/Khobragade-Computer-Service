const menuItems = document.querySelectorAll(".sidebar ul li");

const sections = {

"🏠 Dashboard": ".header",

"📢 Government Updates": ".update-form",

"🛠 Services": ".service-form",

"📂 Categories": ".category-form",

"📄 Documents": "#documentsSection",

"📺 YouTube": "#youtubeSection",

"📊 Analytics": ".cards",

"⚙️ Settings": "#settingsSection"

};
menuItems.forEach((item)=>{

item.addEventListener("click",()=>{

const text=item.innerText.trim();

const target=sections[text];

if(target){

const section=document.querySelector(target);

if(section){

section.scrollIntoView({

behavior:"smooth",

block:"start"

});

}

}

});

});
window.addEventListener("DOMContentLoaded",()=>{

const logout=document.getElementById("logoutBtn");

if(logout){

logout.addEventListener("click",()=>{

if(confirm("Logout karna chahte ho?")){

window.location.href="login.html";

}

});

}

});
window.highlightMenu=function(activeText){

menuItems.forEach((item)=>{

item.classList.remove("active-menu");

if(item.innerText.trim()===activeText){

item.classList.add("active-menu");

}

});

};

window.addEventListener("scroll",()=>{

const scrollY=window.scrollY;

if(scrollY<300){

highlightMenu("🏠 Dashboard");

}else if(scrollY<900){

highlightMenu("📢 Government Updates");

}else if(scrollY<1500){

highlightMenu("🛠 Services");

}else{

highlightMenu("📂 Categories");

}

});
window.addEventListener("load",()=>{

highlightMenu("🏠 Dashboard");

});

export{

highlightMenu

};
