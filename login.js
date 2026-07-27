const loginBtn = document.getElementById("loginBtn");

const username = document.getElementById("username");

const password = document.getElementById("password");

const loginMessage = document.getElementById("loginMessage");

const ADMIN_USERNAME = "admin";

const ADMIN_PASSWORD = "123456";
loginBtn.addEventListener("click",()=>{

const user = username.value.trim();

const pass = password.value.trim();

if(user === "" || pass === ""){

loginMessage.innerText = "Please enter username and password.";

return;

}

if(user === ADMIN_USERNAME && pass === ADMIN_PASSWORD){

sessionStorage.setItem("adminLoggedIn","true");

loginMessage.style.color = "green";

loginMessage.innerText = "Login Successful...";

setTimeout(()=>{

window.location.href = "dashboard.html";

},1000);

}else{

loginMessage.style.color = "red";

loginMessage.innerText = "Invalid Username or Password.";

}

});
window.addEventListener("DOMContentLoaded",()=>{

const isLoggedIn=sessionStorage.getItem("adminLoggedIn");

if(isLoggedIn==="true"){

window.location.href="dashboard.html";

}

});

document.addEventListener("keypress",(e)=>{

if(e.key==="Enter"){

loginBtn.click();

}

});
window.logout=function(){

sessionStorage.removeItem("adminLoggedIn");

window.location.href="login.html";

};

window.checkLogin=function(){

const isLoggedIn=sessionStorage.getItem("adminLoggedIn");

if(isLoggedIn!=="true"){

window.location.href="login.html";

}

};

checkLogin();
window.addEventListener("load",()=>{

checkLogin();

});

window.clearLoginForm=function(){

username.value="";

password.value="";

loginMessage.innerText="";

};

export{

checkLogin,

logout

};
