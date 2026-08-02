//get dom parts
const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

//define event 
const handleLoginTabClick = (event) => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
}
const handleRegisterTabClick = (event) => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
}
const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
}
const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const username = registerUsernameInput.value;
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
}
loginTab.addEventListener("click", handleLoginTabClick);
registerTab.addEventListener("click", handleRegisterTabClick);