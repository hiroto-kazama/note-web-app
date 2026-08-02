# Windows 開発 ➔ Linux 移行 ワークフロー完全ガイド

本ガイドでは、**「開発は Windows 上の Docker で行い、テスト・運用は Linux サーバー上の Docker へ移行する」** プロ仕様の開発フローをステップバイステップで説明します。

---

## 1. 開発・移行ワークフロー全体像

```text
┌─────────────────────────────────────────────────────────┐
│ 【Phase 1】 Windows ローカル開発環境                    │
│  ・Windows 上の Docker Desktop で MySQL を起動          │
│  ・Node.js ＆ HTML/CSS/JS を実装・テスト                │
└───────────────────────────┬─────────────────────────────┘
                            │ (ソースコード ＆ docker-compose 転送)
                            ▼
┌─────────────────────────────────────────────────────────┐
│ 【Phase 2】 Linux テスト・運用環境 (VirtualBox / VPS)   │
│  ・Linux 上の Docker で `docker compose up -d`          │
│  ・本番想定の動作確認・検証                             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Windows 上での開発手順

### 2.1 事前準備 (Windows)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) がインストールされ、起動していることを確認します。

### 2.2 MySQL コンテナの起動
プロジェクトルート (`NoteWebApp/`) でコマンドプロンプトまたは PowerShell を開き、実行します：

```powershell
# MySQL コンテナの起動
docker compose up -d

# 起動状態の確認
docker compose ps
```
これで Windows 上で MySQL 8.0 (`localhost:3306`) が起動し、`init.sql` により `users` および `notes` テーブルが自動作成されます。

### 2.3 Node.js ＆ フロントエンドの開発
1. バックエンド (Node.js/Express) を起動し、`localhost:3306` の MySQL に接続します。
2. フロントエンド (HTML/CSS/JS) を作成し、バックエンド API (`localhost:3000`) と接続して機能テストを行います。

---

## 3. Phase 2: Linux サーバーへの移行手順

Windows 上で開発・動作確認が完了したら、Linux サーバー環境へ移行します。

### 3.1 Linux サーバーへファイルを転送
以下のいずれかの方法で、プロジェクトコードを Linux サーバーへ転送します：
- **方法 A (Git を使用 - 推奨)**: GitHub などのリポジトリに push し、Linux 側で `git clone` する。
- **方法 B (SCP / SFTP)**: PowerShell から Linux へファイルを転送する。
  ```powershell
  scp -r d:\Users\kazah\Downloads\Projects\NoteWebApp user@<LinuxのIP>:/home/user/NoteWebApp
  ```

### 3.2 Linux 上での環境変数設定 (`.env`)
Linux サーバー上の `.env` を必要に応じて変更します（パスワードやシークレットキーの変更）。

### 3.3 Linux 上での Docker コンテナ起動
Linux のターミナルでプロジェクトディレクトリに移動し、起動します：

```bash
cd ~/NoteWebApp

# Linux 上で Docker コンテナを一括起動
docker compose up -d

# ログの確認
docker compose logs -f
```

---

## 4. 移行時に「環境の差異」でハマらないための 3 大ポイント

1. **Docker のおかげで DB 環境は 100% 共通**:
   - Windows でも Linux でも同じ `docker-compose.yml` を使うため、MySQL のバージョンや初期設定のズレが発生しません。
2. **パス区切りの注意 (コード内)**:
   - Node.js 内でファイルパスを扱う際は、Windows 専用の `\` ではなく、`path.join()` を使用するか `/` を使うことで、Linux 上でも修正なしで動作します。
3. **環境変数 (`.env`) の管理**:
   - ソースコード内に接続先 IP やパスワードを直書きせず、すべて `.env` 経由で読み込む設計にしておくことで、Windows ↔ Linux 間の移行がスムーズになります。
