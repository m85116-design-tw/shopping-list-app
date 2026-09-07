# 狀態(State)

- 單一全域 `state` 物件(`items`、`activeStore`、`activeCategory`、`activeShareMode`、`view`、`readonly`)。`saveState` 會同時寫兩份:自己的 `localStorage`(鍵值 `STORAGE_KEY = "pocket-shopping-list-v4"`,離線/第一次進站用)跟 Firebase Firestore 的雲端文件(跨裝置同步用,見 [firestore.md](firestore.md))。
- **`STORAGE_KEY` 這個版本化鍵值沒有任何遷移(migration)邏輯**——把 `v4` 升到 `v5` 會直接讓所有使用者的本機資料回退到範例資料集。若真的需要改動 item 的資料結構,務必謹慎決定(這點 Firestore 那份文件也一樣沒有遷移邏輯)。
- `state.activeStore` 刻意**不**持久化,也**不**同步到 Firestore(重新整理或透過分享連結進入都要自己選店家)——這是唯一保留在純前端、跟雲端無關的一塊 UI 狀態。
- 搜尋文字與「必買」開關是即時從 DOM 讀取的(`searchInput.value`、`mustToggle.checked`),在 `getFilteredItems` 內部使用,並未存在 `state` 裡,也不會同步到雲端。如果需要讓它們持久化,要同時改 `state`、`saveState`／`loadState`、`docPayload` 這幾個地方。
- 唯讀模式是靠散落在各個寫入點(表單送出、切換開關、切換店家等)的 `if (state.readonly) return;` 這種防護來實現,而不是集中在單一檢查點——新增任何寫入路徑時要自己補上這個防護。`renderReadonlyState` 是唯一一處會把唯讀狀態反映回 UI(停用輸入欄位／按鈕)的地方。
