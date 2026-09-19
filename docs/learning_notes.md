# 実装学びノート (Learning Notes)

**プロジェクト名**: NoteWebApp  
**記録日**: 2026-07-21  
**テーマ**: Docker Desktop (Windows) 上での MySQL 8.0 構築 ＆ Docker Compose 実践

---

## 1. 今回の成果・マイルストーン

- Windows 上で `docker compose up -d` を実行し、MySQL 8.0 コンテナの起動に成功。
- コンテナ初回起動時に `init.sql` が読み込まれ、データベース `notes_db` および `users` / `notes` テーブルが自動構築された。

---

## 2. `init.sql`（初期化 SQL）の書き方と学び

### ① 基本的な役割
- MySQL コンテナが**初回起動**する際に、データベースやテーブルを自動作成するために用意する SQL スクリプト。

### ② 基本構文
- **データベース作成と選択**:
  ```sql
  CREATE DATABASE IF NOT EXISTS データベース名;
  USE データベース名;
  ```
- **テーブル作成**:
  ```sql
  CREATE TABLE テーブル名 (
      カラム名 データ型 制約,
      ...
  );
  ```

### ③ 今回学んだ重要なポイント・ハマりどころ
1. **`DROP TABLE` の順番（依存関係）**:
   - 外部キーで結合している場合、親テーブル（`users`）を先に消そうとするとエラーになる。
   - 必ず **子テーブル（`notes`）を先に消してから親テーブル（`users`）を消す**。
2. **制約の記述ルール**:
   - `username VARCHAR(50) UNIQUE NOT NULL` のように、同じカラムの制約（`UNIQUE` と `NOT NULL`）同士の間にカンマ `,` を入れない。
3. **文末のセミコロン `;`**:
   - 各 SQL 文および `CREATE TABLE ()` の閉じ括弧の末尾には必ず `;` を付ける。
4. **外部キー（FOREIGN KEY）の独立定義**:
   - カラム定義の末尾に独立した行として以下のように記述する：
     `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
   - `ON DELETE CASCADE` をつけることで、ユーザー削除時にそのユーザーのノートも連動削除される。
5. **更新日時の自動更新**:
   - `DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` と書くことで、レコード更新時にも自動で現在時刻が記録される。

---

## 3. `docker-compose.yml`（Compose ファイル）の書き方と学び

### ① 基本的な役割
- コンテナの起動オプション（イメージ名、環境変数、ポート、ボリューム等）を1つのファイルに集約し、`docker compose up -d` のコマンド一発で完全な環境を立ち上げられるようにする設計図。

### ② 今回作成した構成要素
```yaml
services:
  db:
    image: mysql:8.0
    volumes:
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: notes_db
      MYSQL_USER: user_name
      MYSQL_PASSWORD: user_password
    ports: 
      - "3306:3306"
```

### ③ 今回学んだ重要なポイント・ハマりどころ
1. **`volumes:` による初期化 SQL のマウント**:
   - `./db/init.sql`（自分のPC）を `/docker-entrypoint-initdb.d/init.sql`（コンテナ内）へ受け渡すことで、コンテナ起動時の自動テーブル作成が実現する。
2. **`ports:` の書き方とクォーテーション**:
   - YAML の仕様上、`3306:3306` を数値のまま書くと「時間（60進数）」として解釈される誤作動リスクがある。
   - そのため、リスト表記 `-` かつ **ダブルクォーテーションで囲む `"- 3306:3306"`** のが安全なベストプラクティス。
3. **`environment:` の一致**:
   - `MYSQL_DATABASE` の値（`notes_db`）は、`init.sql` 内で作成するデータベース名と一致させておく。

---

## 4. よく使う Docker コマンドまとめ

- **コンテナの起動（バックグラウンド）**:
  ```powershell
  docker compose up -d
  ```
- **コンテナの稼働状態確認**:
  ```powershell
  docker compose ps
  ```
- **コンテナのログ確認**:
  ```powershell
  docker compose logs -f
  ```
- **コンテナの停止・削除**:
  ```powershell
  docker compose down
  ```

---

## 5. 本日の学び (2026-07-25): データ永続化・プロジェクトルール設定

### ① Docker Compose における DB データの永続化 (Volume Mount)
* **ハマりどころ・現象**:
  - `docker compose down` を実行したりコンテナを再起動するたびに、作成したテーブルデータや履歴が消去されてしまっていた。
* **根本原因**:
  - `docker-compose.yml` にデータ格納ディレクトリ（`/var/lib/mysql`）のマウント設定が存在しなかったため、データがコンテナ内部の書き捨て領域に保存されていた。
* **解決策**:
  - ホスト側の `./db/data` または名前付きボリューム (`mysql_data`) を `/var/lib/mysql` にマウントすることで、コンテナ再起動後も DB データを永続保持可能。

### ② AIアシスタントとの協働と設定自動化 (`AGENTS.md`)
* **対話ログの管理**:
  - AIとの会話ログはリポジトリ内ではなく、ローカルのシステム領域 (`~/.gemini/...`) に保存されるため、Gitリポジトリを汚さない。
* **プロジェクト専用ルールの定義 (`.agents/AGENTS.md`)**:
  - リポジトリ直下に `.agents/AGENTS.md` を配置することで、新しいチャットを開始しても「ヒント提示 ➔ 実装 ➔ レビュー」のメンターモードや「`learning_notes.md` の自動更新」といった学習ルールを常に自動適用できる。

---

## 6. 本日の学び (2026-07-25): Express サーバー構築と ES Modules

### ① Express サーバーの基本構造 (`server.js`)
* **モジュール読み込み (ES Modules)**:
  - `package.json` に `"type": "module"` を設定したことで、`import express from 'express'` や `import 'dotenv/config'` などのモダンな構文を使用。
* **CORS と JSON パースのミドルウェア**:
  - `cors()` パッケージを追加（`pnpm add cors`）し、`app.use(cors())` および `app.use(express.json())` を設定してフロントエンド連携とリクエスト解析の基盤を整備。
* **`node --watch` による開発自動化**:
  - `package.json` の `"scripts"` に `"dev": "node --watch server.js"` を定義。外部パッケージ (nodemon) なしでファイル変更の即時反映を実現。
* **動作検証**:
  - `http://localhost:3000/` で `Hello World!` のレスポンスを正常に受け取り、サーバー稼働を確認。

### ② MySQL コネクションプールの構築とトラブルシューティング
* **コネクションプール (`src/config/db.js`)**:
  - リソースの無駄遣い（Too many connections）を防ぐため、`mysql2/promise` の `createPool()` を使用してアプリ全体で再利用可能な接続管理（`db.js`）を構築。
* **`server.js` での非同期接続テスト**:
  - `pool.getConnection()` を `try...catch` で囲み、安全なリソース解放 (`connection.release()`) を実施。
* **`ECONNREFUSED` エラーの根本原因と対処**:
  - エラー原因: Docker Desktop が未起動のため、ポート 3306 で MySQL が待ち受けておらず接続拒否が発生。
  - 対処法: Docker Desktop 起動後、`docker compose up -d` でコンテナを立ち上げることで `Connection to MYSQL succeeded` を確認。

---

## 7. 本日の学び (2026-07-25): ユーザー登録 API (`POST /api/auth/register`) の実装

### ① 認証 API の設計とセキュリティ
* **パスワードの暗号化 (`bcrypt`)**:
  - データベースに生パスワードを保存せず、`bcrypt.hash(password, 10)` で安全性・不可逆性を確保して保存。
* **入力バリデーション**:
  - `username`, `email`, `password` の必須チェックを行い、欠落時は `400 Bad Request` を即時返却。
* **重複判定とエラーハンドリング**:
  - MySQL の UNIQUE 制約（`username`, `email`）違反時の `ER_DUP_ENTRY` エラーを検出。
  - 初回登録時は `201 Created` (`User registered successfully`)、重複登録時は `409 Conflict` (`Username or email already exists.`) が正しく返却される動作を確認・検証完了。

---

## 8. 本日の学び (2026-07-25): ユーザーログイン API (`POST /api/auth/login`) の実装

### ① ログイン認証とセキュアな設計
* **`POST` メソッド採用の理由**:
  - `GET` とは異なり、パスワード等の重要情報を URL や Web サーバーのアクセスログに露出させず、暗号化されるリクエストボディに隠して送信するため `POST` を採用。
* **パスワード照合 (`bcrypt.compare`)**:
  - 入力された平文パスワードと DB 内のハッシュ化パスワードを `bcrypt.compare(password, user.password_hash)` で安全に検証。
* **情報漏洩を防ぐレスポンス設計**:
  - 成功時 (`200 OK`) は DB の `password_hash` を除外し、安全なユーザー情報 (`{ id, username, email }`) のみ返却。
  - 誤ったパスワードや未登録メールアドレスのテストに対し `401 Unauthorized` を正しく返却する動作を確認・検証完了。
* **JWT (JSON Web Token) 発行の実装**:
  - 認証成功時に `jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '1h' })` で 1時間有効なデジタル通行トークンを発行し、レスポンスとしてクライアントへ返却。

### ② 認証保護ミドルウェア (`src/middleware/authMiddleware.js`) の構築
* **役割と動作フロー**:
  - 保護対象ルートへのリクエストに対し、`Authorization` ヘッダーから `Bearer <token>` を抽出して検証。
  - トークンなし (`401 Unauthorized`)、無効/期限切れ (`403 Forbidden`)、正常 (`req.user = user` を設定して `next()` 実行) の3パターン制御を実装・自動テスト完了。

---

## 9. 本日の学び (2026-07-25): ノート管理 API (`POST /api/notes`) の実装

### ① 認証保護下でのデータ作成 (Note Creation)
* **安全な所有者紐づけ**:
  - クライアントから `user_id` を送信させず、`authenticateToken` が解読した `req.user.id` を使って安全に `notes` テーブル（外部キー `user_id`）にレコードを保存。
* **動作検証**:
  - `POST /api/notes` リクエストに対し `201 Created` (`Note created successfully`) を返却し、MySQL の `notes` テーブルに正しくデータが格納されることを自動テスト・実データ検索により検証完了。

### ② ノート一覧取得 (Read Notes)
* **認証所有者ベースのフィルタリング**:
  - `GET /api/notes` で `authenticateToken` 経由の `req.user.id` に該当するノートのみを `SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC` で抽出。
* **動作検証**:
  - `GET /api/notes` リクエストに対し `200 OK` で自身のノート配列 (`notes: [...]`) が最新作成順に返却されることを自動テストにより確認・検証完了。

### ③ ノート更新 (Update Note)
* **複合条件による安全な更新**:
  - `PUT /api/notes/:id` で URL パラメータ `req.params.id` と所有者 `req.user.id` の双方が一致するレコードを `UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?` で更新。
  - `result.affectedRows === 0` を判定し、未存在・他人のノートに対する不正更新 (`404 Not Found`) をブロックする安全制御を実装・検証完了。

### ④ ノート削除 (Delete Note)
* **安全な所有権検証付き削除**:
  - `DELETE /api/notes/:id` で `DELETE FROM notes WHERE id = ? AND user_id = ?` を実行。
  - 他人のノートや非存在ノートの削除試行に対し `result.affectedRows === 0` で判定し `404 Not Found` を返す防御設計を構築。
  - 削除成功時 `200 OK` (`Note deleted successfully`) の返却および MySQL テーブルからの正常削除を自動テストで検証完了。

---

## 10. 本日の学び (2026-07-26): SPA フロントエンド画面の実装 ＆ API 統合

### ① SPA (Single Page Application) アーキテクチャの構築
* **静的ファイル配信 (`express.static('public')`)**:
  - Express の静的ミドルウェアを導入し、`http://localhost:3000/` アクセス時に `public/index.html` を自動返却。
* **画面レイアウトとデザインシステム (`public/style.css`)**:
  - ダークモード基調の現代的な UI スタイル、カードデザイン、レスポンシブ Grid、スムーズなトランジション効果を構築。
* **Fetch API と状態保持 (`public/app.js`)**:
  - ユーザー登録・ログイン成功時に取得した JWT トークンを `localStorage` に保存。
  - 認証状態（ログイン前/ログイン後）に応じた `hidden` クラス切替制御および Fetch API による全 CRUD 操作の完全連携を実現。

---

## 11. 本日の学び (2026-08-06): フロントエンド ↔ バックエンドの認証API連携

### ① フォーム送信イベントの適切なバインド
* **`click` イベント vs `submit` イベント**:
  - `loginForm` などのフォーム要素に対して `click` イベントを設定してしまうと、入力欄をクリックしただけでも送信処理が暴発する。
  - フォーム送信の制御には、必ず `"submit"` イベントを紐付け、イベントハンドラ内で `event.preventDefault()` を実行して不要なリロードを防ぐ。

### ② Fetch API を用いた非同期通信とレスポンス解析
* **`fetch` オプションと `JSON.stringify`**:
  - 送信データは JSON 文字列にシリアライズ (`JSON.stringify`) し、ヘッダーに `Content-Type: application/json` を明示して送信する。
  - ドメインが同一であれば、相対パス（`/api/auth/login` など）でリクエストを送ることが環境依存を防ぐベストプラクティス。
* **`response`（外箱）と `data`（中身）の区別**:
  - `fetch` が返す `response` はステータス等を持つ HTTP 応答オブジェクト。
  - `await response.json()` によって初めてサーバーから返ってきた実際のデータオブジェクト（トークンなどを含む `data`）にアクセスできる。

### ③ エラーハンドリングと `try...catch` のスコープ設計
* **`try` ブロック内のスコープ**:
  - `try { ... }` の内部で定義した変数 (`const data` など) はブロック外から参照できない。成功ルートや失敗ルートの処理は、このスコープを考慮して `try` ブロック内にまとめる。
* **`response.ok` による成否判定**:
  - 通信が成功したかどうかを `response.ok` (ステータスコードが 200 番台か) で判定し、成功時は `localStorage` へのトークン保存、失敗時は `data.message` を使ったアラート表示を行う。

### ④ DOM操作における `textContent` と `value` の違い
* **`textContent`**: `div` や `span` などの囲み要素のテキストを設定するために使用する。
* **`value`**: `input` や `textarea` などの入力欄に入力された値を設定・取得するために使用する。

---

## 12. 本日の学び (2026-08-30): VirtualBox (Ubuntu) での自作サーバー構築と Linux 移行

### ① VirtualBox ネットワークと SSH リモート接続
* **ホストオンリーアダプターの活用**:
  - `192.168.56.xxx` のローカル IP を介して Windows（ホスト）と Ubuntu（ゲスト VM）間で直接通信。
* **SSH による快適なサーバー管理**:
  - `openssh-server` を導入し、Windows の PowerShell から `ssh user@IP` で接続することで、クリップボード共有の制約を受けずに快適な操作・コピペ環境を実現。

### ② GitHub と SSH 鍵認証 (`ed25519`) による継続的デプロイ基盤
* **パスワード認証廃止と公開鍵認証**:
  - `ssh-keygen -t ed25519` で生成した公開鍵を GitHub に登録することで、パスワード入力なしで安全に `git clone` や `git pull` によるコード同期が可能に。
  - Windows で `git push` ➔ Ubuntu で `git pull` の一発同期ワークフローを確立。

### ③ ポート競合 (`address already in use: 3306`) の根本原因と解決
* **トラブル現象**:
  - Docker 起動時に `failed to bind host port 0.0.0.0:3306/tcp: address already in use` が発生。
* **根本原因と対処**:
  - Ubuntu OS 自体のネイティブ MySQL サービスが自動起動して 3306 ポートを占有していた。
  - `sudo systemctl stop mysql` および `sudo systemctl disable mysql` を実行して停止・無効化し、Docker コンテナへポートを譲渡して解決。

### ④ 自作 Ubuntu サーバーからの Web アプリ配信
* **マルチ環境での稼働確認**:
  - Ubuntu 上で Docker (MySQL 8.0) と Node.js (Express) を起動し、Windows ブラウザから `http://192.168.56.101:3000` にアクセスして Web アプリが正常稼働することを確認。

---

## 13. 本日の学び (2026-09-16): 認証付きノート作成 (Create) 連携とイベント制御

### ① `Authorization: Bearer <token>` ヘッダーの仕様と落とし穴
* **半角スペースの重要性**:
  - HTTP 認証ヘッダーでは `'Authorization': 'Bearer ' + token` のように、スキーム名（`Bearer`）とトークン値の間に**必ず半角スペース**が必要。
  - スペースが抜けるとサーバーの `authHeader.split(' ')[1]` でトークンを抽出できず、`401 Unauthorized: Malformed token` エラーになる。

### ② 変数のシャドウイングと TDZ (Temporal Dead Zone)
* **現象と根本原因**:
  - ファイル冒頭の DOM 変数（`noteTitle`）と同名のローカル変数を関数内で `const noteTitle = noteTitle.value;` と定義しようとすると、宣言前の参照とみなされ `ReferenceError: Cannot access 'noteTitle' before initialization` が発生する。
* **解決策**:
  - 入力値を受け取るローカル変数は `const title = noteTitle.value;` のように意味の異なる適切な名前をつける。

### ③ イベントリスナーの登録位置とフォーム送信の制御
* **関数の外側でのイベント登録**:
  - `noteForm.addEventListener("submit", handleNoteSubmit)` を関数内部に書いてしまうと、初回クリック時にハンドラが実行されず、HTML フォームのデフォルト動作（ページ全体のリロード）が暴発して初期画面（ログイン前）に戻ってしまう。
  - イベントリスナーは必ず関数の「外側（スクリプトの末尾など）」で登録する。

---

## 14. 本日の学び (2026-09-16): ノート一覧表示 (Read) と動的DOMレンダリング

### ① テンプレートリテラルを用いた動的 HTML レンダリング
* **バッククォート記法と変数の展開**:
  - `innerHTML` にバッククォート（`` ` ``）を使って HTML 構造を定義し、`${note.title}` や `${note.content}` で各ノートのプロパティを埋め込む。
  - `new Date(note.created_at).toLocaleString()` で作成日時を日本標準の可読な日時にフォーマット。

### ② 配列の反復処理と DOM への追加 (`appendChild`)
* **データ構造の階層理解**:
  - サーバーの返却データ `{ notes: [ ... ] }` から配列部分（`data.notes`）を取り出して `forEach` でループ処理。
  - `document.createElement('div')` でカード枠を生成し、`notesContainer.appendChild(newDiv)` で親コンテナに追加。
  - ノートが 0 件の場合のメッセージ分岐と、一覧再取得前の `notesContainer.innerHTML = ""` によるリセット制御。

### ③ ライフサイクルと連動した自動取得（リアクティブUI）
* **呼び出しタイミングの集約**:
  - `fetchNotes()` を「通常ログイン成功時」「リロード（自動ログイン）時」「新規ノート作成成功時」の 3 箇所で呼び出すことで、画面リロードなしで常に最新の一覧が同期される SPA アーキテクチャを実現。
