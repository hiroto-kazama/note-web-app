# 基本設計・仕様書 (Design Specification)

**プロジェクト名**: Simple Note Web App  
**バックエンド**: Node.js (Express)  
**データベース**: MySQL  
**接続ライブラリ**: `mysql2` (`async`/`await` 対応 コネクションプール)  
**認証方式**: JWT (JSON Web Token) ＋ bcrypt パスワードハッシュ  
**ステータス**: 設計確定 (実装準備完了)  

---

## 1. データベース設計 (MySQL Schema & DDL)

ユーザーとノートの 1:N リレーションシップを持つデータベース構成。

### 1.1 テーブル定義

#### ① `users` テーブル (ユーザー管理)
| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ユーザーID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | 表示ユーザー名 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | ログイン用メールアドレス |
| `password_hash` | VARCHAR(255) | NOT NULL | bcryptハッシュ化済みパスワード |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 登録日時 |

#### ② `notes` テーブル (ノートデータ)
| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ノートID |
| `user_id` | INT | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE | ノートの所有ユーザーID |
| `title` | VARCHAR(255) | NOT NULL | ノートのタイトル |
| `content` | TEXT | NULL | ノートの本文 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 最終更新日時 |

---

### 1.2 テーブル作成 SQL への要求仕様

※具体的な DDL（SQL）は記載していません。上記 「1.1 テーブル定義」 の仕様を満たす `CREATE TABLE` 文を自分で実装してください。
- 適切なデータ型と制約（`PRIMARY KEY`, `AUTO_INCREMENT`, `UNIQUE`, `NOT NULL`, `DEFAULT` など）を設定すること。
- `notes` テーブルの `user_id` には、`users` テーブルを参照する外部キー制約（`FOREIGN KEY`）と削除時連動（`ON DELETE CASCADE`）を設定すること。


---

## 2. 環境変数設計 (`.env`)

データベース接続情報やJWTシークレットをソースコードに直接書かないよう、環境変数で管理する。

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=note_app_db
JWT_SECRET=super_secret_key_change_this_in_production
```

---

## 3. REST API 仕様詳細

### 3.1 認証系 API (`/api/auth`)

#### ① ユーザー新規登録
- **HTTP Method / URL**: `POST /api/auth/register`
- **Request Body (JSON)**:
  ```json
  {
    "username": "taro",
    "email": "taro@example.com",
    "password": "secretpassword123"
  }
  ```
- **Response Success (`201 Created`)**:
  ```json
  {
    "message": "ユーザー登録が完了しました",
    "user": {
      "id": 1,
      "username": "taro",
      "email": "taro@example.com"
    }
  }
  ```

#### ② ログイン
- **HTTP Method / URL**: `POST /api/auth/login`
- **Request Body (JSON)**:
  ```json
  {
    "email": "taro@example.com",
    "password": "secretpassword123"
  }
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "message": "ログイン成功",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 1,
      "username": "taro",
      "email": "taro@example.com"
    }
  }
  ```

#### ③ ログインユーザー情報確認 (認証チェック)
- **HTTP Method / URL**: `GET /api/auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response Success (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "taro",
      "email": "taro@example.com"
    }
  }
  ```

---

### 3.2 ノート操作 API (`/api/notes`) ※要認証ヘッダー

#### ① ノート一覧取得 (自分のノートのみ)
- **HTTP Method / URL**: `GET /api/notes`
- **Header**: `Authorization: Bearer <token>`
- **Response Success (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "title": "最初のノート",
      "content": "ここに本文が入ります",
      "created_at": "2026-07-21T00:00:00Z",
      "updated_at": "2026-07-21T00:00:00Z"
    }
  ]
  ```

#### ② ノート新規作成
- **HTTP Method / URL**: `POST /api/notes`
- **Header**: `Authorization: Bearer <token>`
- **Request Body (JSON)**:
  ```json
  {
    "title": "買い物リスト",
    "content": "牛乳, 卵, パン"
  }
  ```
- **Response Success (`201 Created`)**:
  ```json
  {
    "id": 2,
    "user_id": 1,
    "title": "買い物リスト",
    "content": "牛乳, 卵, パン",
    "created_at": "2026-07-21T00:05:00Z",
    "updated_at": "2026-07-21T00:05:00Z"
  }
  ```

#### ③ ノート更新
- **HTTP Method / URL**: `PUT /api/notes/:id`
- **Header**: `Authorization: Bearer <token>`
- **Request Body (JSON)**:
  ```json
  {
    "title": "更新後のタイトル",
    "content": "更新後の本文"
  }
  ```
- **Response Success (`200 OK`)**:
  ```json
  {
    "message": "ノートを更新しました",
    "note": { ... }
  }
  ```

#### ④ ノート削除
- **HTTP Method / URL**: `DELETE /api/notes/:id`
- **Header**: `Authorization: Bearer <token>`
- **Response Success (`200 OK`)**:
  ```json
  {
    "message": "ノートを削除しました"
  }
  ```

---

## 4. エラーレスポンス設計 (統一フォーマット)

エラー時のレスポンスは一律以下のフォーマットとする：

- **400 Bad Request** (入力不足など):
  ```json
  { "error": "メールアドレスとパスワードは必須です" }
  ```
- **401 Unauthorized** (未ログイン / トークン無効):
  ```json
  { "error": "認証トークンが無効または期限切れです" }
  ```
- **404 Not Found** (指定IDのノートが存在しない / 他人のノート):
  ```json
  { "error": "ノートが見つかりません" }
  ```
- **500 Internal Server Error** (サーバー内部エラー):
  ```json
  { "error": "サーバー内部でエラーが発生しました" }
  ```
