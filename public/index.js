// =============================================================================
// 1. DOM要素の取得 (DOM Elements)
// =============================================================================

// タブ切り替えボタン
const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");

// フォーム要素
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// ログインフォーム入力フィールド
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

// 新規登録フォーム入力フィールド
const registerUsernameInput = document.getElementById("register-username");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");

// セクション・通知エリア
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const alertBox = document.getElementById("alert-box");

// ノート関連要素
const noteTitle = document.getElementById("note-title-input");
const noteBody = document.getElementById("note-content-input");
const noteSubmit = document.getElementById("save-note-btn");
const noteCancel = document.getElementById("cancel-edit-btn");
const noteForm = document.getElementById("note-form");
const notesContainer = document.getElementById("notes-container");

// ユーザー情報・ログアウト
const logoutButton = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

// =============================================================================
// 2. ノート一覧の取得・描画関数 (Fetch & Render Notes)
// =============================================================================

/**
 * サーバーからノート一覧を取得して画面にカード描画する
 */
const fetchNotes = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }
    try {
        const response = await fetch('/api/notes', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await response.json();

        if (response.ok) {
            // 一覧のコンテナをクリア
            notesContainer.innerHTML = "";

            // ノートが0件の場合のメッセージ表示
            if (!data.notes || data.notes.length === 0) {
                notesContainer.innerHTML = "<p class='no-notes-msg'>ノートがまだありません。新しいノートを作成してみましょう！</p>";
                return;
            }

            // ノート配列をループしてカード要素を追加
            data.notes.forEach(note => {
                const newDiv = document.createElement('div');
                newDiv.className = "note-card";
                newDiv.innerHTML = `
                    <h3 class="note-card-title">${note.title}</h3>
                    <p>${note.content || ''}</p>
                    <div class="note-card-footer">
                        <small>${new Date(note.created_at).toLocaleString()}</small>
                        <div>
                            <button class="btn btn-secondary edit-btn" data-id="${note.id}">編集</button>
                            <button class="btn btn-danger delete-btn" data-id="${note.id}">削除</button>
                        </div>
                    </div>
                `;
                notesContainer.appendChild(newDiv);
            });
        }
    } catch (error) {
        console.error('Fetch notes error:', error);
    }
};

// =============================================================================
// 3. イベントハンドラ: 認証画面のタブ切り替え (Tab Switching)
// =============================================================================

/**
 * ログインタブをクリックした時の処理
 */
const handleLoginTabClick = (event) => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
};

/**
 * 新規登録タブをクリックした時の処理
 */
const handleRegisterTabClick = (event) => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
};

// =============================================================================
// 4. イベントハンドラ: 認証API通信 (Authentication Handlers)
// =============================================================================

/**
 * ログインフォーム送信時の処理
 */
const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);

            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            userInfo.classList.remove('hidden');

            // ログイン成功時にノート一覧を取得・描画
            fetchNotes();
        } else {
            console.error(data.message);
            alertBox.textContent = data.message;
            alertBox.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        alertBox.textContent = "Connection failed. Try again later";
        alertBox.classList.remove('hidden');
    }
};

/**
 * 新規ユーザー登録フォーム送信時の処理
 */
const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const username = registerUsernameInput.value;
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alertBox.textContent = 'Register succeeded';
            alertBox.classList.remove('hidden');

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
        console.error(error);
        alertBox.textContent = "Connection failed. Try again later";
        alertBox.classList.remove('hidden');
    }
};

// =============================================================================
// 5. イベントハンドラ: ノートCRUD処理 (Note CRUD Handlers)
// =============================================================================

/**
 * ノート新規作成フォーム送信時の処理
 */
const handleNoteSubmit = async (event) => {
    event.preventDefault();
    const title = noteTitle.value;
    const content = noteBody.value;
    const data = {
        title: title,
        content: content
    };
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }
    try {
        const url = "/api/notes";
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            noteTitle.value = "";
            noteBody.value = "";
            console.log("note create succeeded");

            // ノート作成成功時に一覧を即時再取得して画面を更新
            fetchNotes();
        } else {
            console.error("note create failed");
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const handleDeleteNote = async (noteID) => {
    if (!confirm("Are you sure you want to delete this note?")) {
        return
    }
    const token = localStorage.getItem('token');
    if (!token) {
        return
    }
    try {
        const url = `/api/notes/${noteID}`
        const header = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
        const response = await fetch(url, {
            method: 'DELETE',
            headers: header
        })
        if (response.ok) {
            fetchNotes();
        }
    } catch (error) {
        console.error("failed");
    };
};
/**
 * ログアウト処理
 */
const handleLogout = () => {
    localStorage.removeItem("token");
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    userInfo.classList.add('hidden');
};

// =============================================================================
// 6. イベントリスナーの登録 (Event Listeners)
// =============================================================================

// タブ切り替え
loginTab.addEventListener("click", handleLoginTabClick);
registerTab.addEventListener("click", handleRegisterTabClick);

// 認証フォーム送信
loginForm.addEventListener("submit", handleLoginSubmit);
registerForm.addEventListener("submit", handleRegisterSubmit);

// ノートフォーム送信
noteForm.addEventListener("submit", handleNoteSubmit);

// ログアウトボタン
logoutButton.addEventListener("click", handleLogout);



// =============================================================================
// 7. 初期化処理 (Auto Login & Initial Fetch)
// =============================================================================

// ページ読み込み時にトークンがあれば自動ログイン＆ノート一覧を取得
const savedToken = localStorage.getItem('token');
if (savedToken) {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');

    // ノート一覧の取得・表示
    fetchNotes();
}

notesContainer.addEventListener('click', (event) => {
    console.log("event:", event);
    if (event.target.classList.contains('delete-btn')) {
        const id = event.target.dataset.id;
        handleDeleteNote(id);
    }
});