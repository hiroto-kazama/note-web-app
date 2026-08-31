//get dom parts
const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const registerUsernameInput = document.getElementById("register-username");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const alertBox = document.getElementById("alert-box")

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
    // TODO: 1. Fetch APIを使って /api/auth/login にPOSTリクエストを送る
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        // TODO: 2. 成功した場合、トークンを localStorage に保存する
        if (response.ok) {
            localStorage.setItem('token', data.token);
            // TODO: 3. ログイン後の画面表示（authSectionを非表示、appSectionを表示）に切り替える
            authSection.classList.add('hidden')
            appSection.classList.remove('hidden')
        } else {
            // TODO: 4. エラーが発生した場合は、画面のアラートエリアにエラーメッセージを表示する
            console.error(data.message);
            alertBox.textContent = data.message;
            alertBox.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        alertBox.textContent = "Connection failed. Try again later";
        alertBox.classList.remove('hidden');
    }
}
const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const username = registerUsernameInput.value;
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
    // TODO: 1. Fetch APIを使って /api/auth/register にPOSTリクエストを送る
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        // TODO: 2. 成功した場合、アラートエリアに成功メッセージを表示する
        if (response.ok) {
            alertBox.textContent = 'Register succeeded';
            alertBox.classList.remove('hidden');
            // TODO: 3. ログインタブへ切り替え（handleLoginTabClickを実行）、登録フォームの入力をクリアする
            registerUsernameInput.value = "";
            registerEmailInput.value = "";
            registerPasswordInput.value = "";
            handleLoginTabClick();
        } else {
            console.error(data.message);
            alertBox.textContent = data.message;
            alertBox.classList.remove('hidden');
        }
    } catch (error) {
        // TODO: 4. 重複エラーなどが発生した場合は、アラートエリアにエラーメッセージを表示する
        console.error(error);
        alertBox.textContent = "Connection failed. Try again later";
        alertBox.classList.remove('hidden');
    }



}
loginTab.addEventListener("click", handleLoginTabClick);
registerTab.addEventListener("click", handleRegisterTabClick);
// TODO: 5. loginForm の送信 (submit) イベントに handleLoginSubmit を登録する
loginForm.addEventListener("submit", handleLoginSubmit)
// TODO: 6. registerForm の送信 (submit) イベントに handleRegisterSubmit を登録する
registerForm.addEventListener("submit", handleRegisterSubmit)