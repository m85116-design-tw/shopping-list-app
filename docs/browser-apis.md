# 瀏覽器 API 使用範圍

`navigator.clipboard.read()`、`navigator.share()`、`FileReader`+`<canvas>`(圖片壓縮到 900px／JPEG 品質 0.78 後才存成 dataURL)、`URLSearchParams` 用於解析 `?list=`／`?mode=`(分享連結不再用 base64 快照,細節見 [firestore.md](firestore.md))。有兩條並行的剪貼簿圖片處理路徑(`readClipboardImage` 給按鈕觸發的讀取用、`usePastedImageFromTarget` 給 `contenteditable` 長按貼上的備用方案用)——這是為了繞過 iOS Safari 不允許從一般按鈕點擊呼叫 `navigator.clipboard.read()` 的限制;如果你動到圖片匯入功能,兩條路徑都要測。

`saveState` 在 `localStorage.setItem` 寫入失敗時(通常是因為內嵌圖片讓資料超過容量上限),會靜默地丟棄每個 item 的 `imageDataUrl` 並重試,只會跳一個 toast 提示——圖片可能無聲無息地消失,不會報錯。分享連結則完全不含圖片(`encodeSnapshot` 一律會去掉 `imageDataUrl`)——這是兩套各自獨立的「圖片會不見」機制,不是同一個(另一套見 [firestore.md](firestore.md))。
