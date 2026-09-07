# 採買口袋清單

這是一份可直接部署到 GitHub Pages 的靜態網站版本。

部署方式：

1. 建立 GitHub repo。
2. 把此資料夾內的 `index.html`、`styles.css`、`script.js`、`.nojekyll` 放到 repo 根目錄。
3. 到 repo 的 Settings → Pages，選擇 `Deploy from a branch`，branch 選 `main`，資料夾選 `/root`。

## 資料庫（Firebase Firestore）

清單資料存在 Firebase 專案 `shopping-list-75450` 的 Firestore，前端直接用 CDN 載入的
Firebase JS SDK 讀寫，沒有自架後端。細節見 `CLAUDE.md`「雲端同步」一節。

安全規則（Firestore Console → Firestore Database → Rules）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lists/{listId} {
      allow get, write: if true;
      allow list: if false;
    }
  }
}
```
