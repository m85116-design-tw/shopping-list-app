# 雲端同步(Firestore)

- Firebase 專案 `shopping-list-75450`,Firestore collection `lists`,一份清單 = 一份文件(doc id 是隨機字串)。**沒有帳號登入**——誰有這個 id(藏在分享連結的 `?list=` 裡),誰就能讀寫這份清單,安全模型跟舊版「有連結才能看」完全一樣,只是現在連結指向的是活的雲端文件而不是凍結的快照。
- 自己的清單 id 產生一次就存在 `localStorage`(`LIST_ID_KEY`),之後每次造訪都用同一個 id。打開別人分享的 `?list=xxx` 連結時,`isOwner` 為 `false`,不會去讀寫自己的 `LIST_ID_KEY`／`STORAGE_KEY`,避免把別人的清單寫進自己的本機清單裡。
- `?mode=readonly` 才是唯讀權限的唯一依據,跟清單本身要不要同步已經分開——「只讀清單」現在看到的也是即時更新的進度,只是不能編輯,不再是分享當下的凍結快照。
- 用 `onSnapshot` 監聽文件變化,收到別的裝置寫入時整頁重新 `render()`。但收到**自己剛寫入、伺服器還沒確認**的那次回呼(`snapshot.metadata.hasPendingWrites === true`)會直接跳過——不然使用者在「現場價」欄位打字打到一半,畫面會被自己送出去的舊值蓋掉、輸入框失焦。改這段邏輯時務必保留這個判斷。
- Firestore 單一文件上限 1MiB,圖片(`imageDataUrl`)是直接塞進文件的 base64,寫入失敗會自動重試一次(去掉圖片)並跳 toast,做法跟 localStorage 那份原本的「容量不夠就丟圖片」機制一樣,是兩套各自獨立的「圖片可能無聲消失」路徑(另一套見 [browser-apis.md](browser-apis.md))。
- 安全規則在 Firebase Console 的 Firestore Rules 設定(不在這個 repo 裡),內容見 `README.md`:`allow get, write: if true`(用 id 存取)+`allow list: if false`(擋掉列出整個 collection,不然只要知道規則語法,任何人都能讀到所有人的清單)。
