# LinkToMe

このアプリは、iPhone の Safari で開いているページ を PC に簡単に送信し、PC 側で一覧・確認・管理できる Web アプリです。

---

## 使い方

### 1. iPhone 側（共有する側）

1. **Safari で共有したいページを開く**
2. 画面下部の「共有」ボタン（四角から上矢印）をタップ
3. 「URL を PC へ送信」をタップ

---

### 2. PC 側

1. アプリの URL（例: `http://<サーバーのアドレス>:3000/`）を PC ブラウザで開く
2. パスワードを入力してログイン
3. 共有された URL の一覧が表示されます
4. 一覧のアイテムをクリックすると新しいタブで共有されたページが開きます
5. 不要な URL は「削除」ボタンで削除できます

---

## 設定方法

### 1. サーバー側

#### セットアップ手順

1. **リポジトリをクローン**

   ```sh
   git clone <このリポジトリのURL>
   cd <プロジェクトディレクトリ>
   ```

2. **依存パッケージをインストール**

   ```sh
   npm install
   ```

3. **設定**

- 環境変数ファイル(.env)をプロジェクトルートに作成し、以下を記載

  ```
  SHARE_PASSWORD=あなたの好きなパスワード
  ```

- サブディレクトリへ公開する場合は以下を設定
  - .env
    ```
    NEXT_PUBLIC_BASE_PATH=/linktome
    ```
  - next.config.js
    ```
    module.exports = {
      basePath: '/linktome',
    }
    ```

4. **Prisma で DB を初期化**

   ```sh
   npx prisma generate
   ```

5. **公開用にビルド**

   ```sh
   npm run build
   ```

#### 起動手順

1. **サーバーを起動**

   ```sh
   npm run start
   ```

2. **PC から `http://<サーバーのアドレス>:3000/` にアクセス**

### 2. iPhone 側

#### セットアップ手順

1. **ショートカットアプリを起動し、新規ショートカット作成**

- 上部タイトルをタップし、名称を「URL を PC へ送信」とする。
- 一度保存して閉じる。

2. **作成したショートカットを長タップし、「詳細」をタップ。**

- 「共有シートに表示」を有効化
- 完了をタップして閉じる

3. **ショートカットを編集**

- 共有シートから受け取る内容
  - 受け取る内容: Safari の URL ページ
  - 入力がない場合は、"error" を "停止して応答"
- Web ページで JavaScript を実行を追加(1)
  - 入力: ショートカットの入力
  - コード内容
    - ```javascript
      completion(document.title);
      ```
- Web ページで JavaScript を実行を追加(2)
  - 入力: ショートカットの入力
  - コード内容
    - ```javascript
      completion(location.href);
      ```
- URL の内容を取得
  - URL: http://<サーバーのアドレス>:3000/api/submit
  - 方法: POST
  - ヘッダ
    - Authorization: "Bearer "+ パスワード平文
    - Content-Type: application/json
  - 本文を要求: JSON
  - フィールド
    - title: (1)の内容
    - url: (2)の内容
- 設定後、保存する

4. **Safari の設定**

- 画面下部の「共有」ボタン（四角から上矢印）をタップ
- 必要に応じて「アクションを編集」をタップし、配置を変える

5. **PC 上のサイトを保管する場合**

- ブックマークレット

```
javascript:(()=>{function showToast(msg,bg='#333'){let t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;top:20px;left:20px;z-index:9999;background:'+bg+';color:#fff;padding:10px 20px;border-radius:6px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.2);opacity:0.95;';document.body.appendChild(t);setTimeout(()=>{t.remove()},2500);}fetch('http://localhost:3000/api/submit',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer あなたのパスワード'},body:JSON.stringify({title:document.title,url:location.href})}).then(()=>showToast('送信しました','seagreen')).catch(e=>showToast('送信失敗','crimson'));})()
```

## よくある質問

**Q. パスワードを忘れた場合は？**  
A. `.env` ファイルの `SHARE_PASSWORD` を確認・変更してください。

**Q. URL が自動で反映されない場合は？**  
A. 5 秒ごとに自動更新されますが、手動でリロードしても OK です。
