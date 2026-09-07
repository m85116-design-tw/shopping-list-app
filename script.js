import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCOgMbtce61IP8sQO6awbvkeLvhXoss1Y",
  authDomain: "shopping-list-75450.firebaseapp.com",
  projectId: "shopping-list-75450",
  storageBucket: "shopping-list-75450.firebasestorage.app",
  messagingSenderId: "486923603984",
  appId: "1:486923603984:web:2f8bee3e37260c9864fa95",
};
const db = getFirestore(initializeApp(firebaseConfig));

const STORAGE_KEY = "pocket-shopping-list-v4";
const LIST_ID_KEY = "pocket-shopping-list-id";

// 清單身分：有 ?list= 就是加入別人分享的清單(寫回同一份雲端文件)，
// 沒有就是自己的清單(第一次造訪會產生一組 id 存在 localStorage)。
// ?mode=readonly 才是「只讀」的唯一依據，跟共同採買/只讀的 UI 切換分開判斷。
const urlParams = new URLSearchParams(window.location.search);
const sharedListId = urlParams.get("list");
const isOwner = !sharedListId;
const listId = sharedListId || localStorage.getItem(LIST_ID_KEY) || crypto.randomUUID();
if (isOwner) localStorage.setItem(LIST_ID_KEY, listId);
const listDocRef = doc(db, "lists", listId);

const stores = {
  all: "全部店家",
  donki: "唐吉軻德",
  drug: "藥妝店",
  market: "超市",
};

const categories = {
  all: "全部",
  health: "保健藥妝",
  beauty: "美妝保養",
  snack: "食品伴手禮",
  kids: "育兒日用品",
};

const shareModes = {
  collab: "同行者打開連結能即時看到採買進度，也能在自己的手機上一起勾選、更新。",
  readonly: "同行者能即時看到採買進度，但不能更動任何狀態。",
};

const shareModeLabels = {
  collab: "共同採買",
  readonly: "只讀清單",
};

const sampleItems = [
  {
    id: "ryukakusan",
    title: "龍角散粉末",
    store: "donki",
    category: "health",
    priority: "must",
    source: "IG Reels",
    note: "網友推薦感冒前兆先買。喉嚨保養區或結帳旁常見。",
    basePrice: 698,
    spotPrice: 648,
    done: false,
    help: true,
    visual: "powder",
  },
  {
    id: "steam-mask",
    title: "蒸氣眼罩家庭包",
    store: "donki",
    category: "beauty",
    priority: "maybe",
    source: "Threads",
    note: "Threads 收藏，說飛機上很好睡。找淡粉色大盒。",
    basePrice: 1180,
    spotPrice: 1180,
    done: true,
    help: false,
    visual: "mask",
  },
  {
    id: "saborino",
    title: "Saborino 早安面膜",
    store: "drug",
    category: "beauty",
    priority: "must",
    source: "網路文章",
    note: "黃色包裝，找補貨架。若 Donki 缺貨，松本清也可買。",
    basePrice: 1320,
    spotPrice: 1398,
    done: false,
    help: false,
    visual: "maskpack",
  },
  {
    id: "leg-patch",
    title: "休足時間腿部舒緩貼",
    store: "donki",
    category: "health",
    priority: "must",
    source: "商品截圖",
    note: "截圖裡是藍綠盒。走很多路可以當天晚上用。",
    basePrice: 798,
    spotPrice: "",
    done: false,
    help: true,
    visual: "leg",
  },
  {
    id: "matcha-cookie",
    title: "抹茶夾心餅乾",
    store: "market",
    category: "snack",
    priority: "maybe",
    source: "朋友推薦",
    note: "家人伴手禮。超市比觀光區便宜就拿兩盒。",
    basePrice: 498,
    spotPrice: 428,
    done: true,
    help: false,
    visual: "snack",
  },
  {
    id: "biore-sun",
    title: "Biore 水感防曬",
    store: "drug",
    category: "beauty",
    priority: "maybe",
    source: "YouTube 截圖",
    note: "確認是否有兩入優惠。包裝有藍色水滴感。",
    basePrice: 880,
    spotPrice: "",
    done: false,
    help: false,
    visual: "sun",
  },
  {
    id: "kids-brush",
    title: "兒童角色牙刷組",
    store: "donki",
    category: "kids",
    priority: "must",
    source: "截圖備忘",
    note: "幫熙熙看小頭軟毛款。不要太硬，先買一組試用。",
    basePrice: 598,
    spotPrice: "",
    done: false,
    help: false,
    visual: "brush",
  },
];

const state = {
  items: [],
  activeStore: "all",
  activeCategory: "all",
  activeShareMode: "collab",
  view: "grid",
  readonly: false,
};

const modeButtons = Array.from(document.querySelectorAll("[data-mode-target]"));
const screens = {
  home: document.querySelector("#home-screen"),
  import: document.querySelector("#import-screen"),
  shop: document.querySelector("#shop-screen"),
};
const itemForm = document.querySelector("#item-form");
const sourceInput = document.querySelector("#source-input");
const titleInput = document.querySelector("#title-input");
const pasteUrlButton = document.querySelector("#paste-url-button");
const manualAddButton = document.querySelector("#manual-add-button");
const pasteImageButton = document.querySelector("#paste-image-button");
const imagePasteTarget = document.querySelector("#image-paste-target");
const pasteStatus = document.querySelector("#paste-status");
const screenshotInput = document.querySelector("#screenshot-input");
const screenshotPreview = document.querySelector("#screenshot-preview");
const screenshotThumb = document.querySelector("#screenshot-thumb");
const screenshotName = document.querySelector("#screenshot-name");
const clearScreenshotButton = document.querySelector("#clear-screenshot-button");
const formToast = document.querySelector("#form-toast");
const draftList = document.querySelector("#draft-list");
const draftCount = document.querySelector("#draft-count");
const resetButton = document.querySelector("#reset-button");
const storeFilters = Array.from(document.querySelectorAll("#store-filters .store-option"));
const categoryFilters = Array.from(document.querySelectorAll("#category-filters .chip"));
// 一定要限定 .view-toggle 底下的 button：清單容器 #shopping-list 自己也有 data-view 屬性
// (renderCards 會寫 list.dataset.view 給 CSS 用)，只寫 [data-view] 會連容器一起抓進來，
// 等於幫整個清單綁上「切換檢視」的點擊監聽器 —— 點清單裡任何東西都會觸發整份重繪，
// 打勾框會在瀏覽器送出 change 事件前就被換掉，導致打勾完全沒反應。
const viewButtons = Array.from(document.querySelectorAll(".view-toggle button[data-view]"));
const shareModeButtons = Array.from(document.querySelectorAll("[data-share-mode]"));
const list = document.querySelector("#shopping-list");
const searchInput = document.querySelector("#search-input");
const mustToggle = document.querySelector("#must-toggle");
const visibleCount = document.querySelector("#visible-count");
const doneCount = document.querySelector("#done-count");
const totalCount = document.querySelector("#total-count");
const emptyState = document.querySelector("#empty-state");
const emptyCopy = document.querySelector("#empty-copy");
const progressRing = document.querySelector(".progress-ring");
const selectedStoreCopy = document.querySelector("#selected-store-copy");
const listTitle = document.querySelector("#list-title");
const shopControls = document.querySelector(".shop-controls");
const sharePanel = document.querySelector(".share-panel");
const listSection = document.querySelector(".list-section");
const shareButton = document.querySelector("#share-button");
const shareLink = document.querySelector("#share-link");
const shareToast = document.querySelector("#share-toast");
const shareModeCopy = document.querySelector("#share-mode-copy");
const imageViewer = document.querySelector("#image-viewer");
const imageViewerImg = document.querySelector("#image-viewer-img");
const imageViewerCaption = document.querySelector("#image-viewer-caption");
const closeImageViewerButton = document.querySelector("#close-image-viewer");

let activeScreenshot = null;

function cloneSampleItems() {
  return sampleItems.map((item) => ({ ...item }));
}

function docPayload() {
  return {
    items: state.items,
    activeCategory: state.activeCategory,
    activeShareMode: state.activeShareMode,
    view: state.view,
  };
}

function saveState() {
  if (state.readonly) return;

  if (isOwner) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docPayload()));
    } catch (error) {
      const slimItems = state.items.map(({ imageDataUrl, ...item }) => item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...docPayload(), items: slimItems }));
      formToast.textContent = "圖片暫存空間不足，已先保存文字清單";
    }
  }

  // ponytail: 圖片直接塞進 Firestore 文件(跟原本 localStorage 的做法一樣)，
  // 單一文件上限 1MiB，圖片多了會寫入失敗。先重試一次(去掉圖片)，
  // 之後如果常常爆量，再改成 Cloud Storage 存圖、文件只存網址。
  setDoc(listDocRef, docPayload()).catch(() => {
    const slimPayload = { ...docPayload(), items: state.items.map(({ imageDataUrl, ...item }) => item) };
    setDoc(listDocRef, slimPayload).catch(() => {
      formToast.textContent = "雲端同步失敗，已先保存在本機";
    });
  });
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    state.items = cloneSampleItems();
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    state.items = Array.isArray(parsed.items) && parsed.items.length ? parsed.items : cloneSampleItems();
    state.activeCategory = parsed.activeCategory || "all";
    state.activeShareMode = shareModes[parsed.activeShareMode] ? parsed.activeShareMode : "collab";
    state.view = parsed.view || "grid";
  } catch (error) {
    state.items = cloneSampleItems();
  }
}

function applyCloudSnapshot(snapshot) {
  // 自己剛寫入、還沒被伺服器確認的那次回呼要跳過，
  // 不然打字打到一半(現場價)畫面會被自己的舊值蓋掉、輸入框失焦。
  if (snapshot.metadata.hasPendingWrites) return;

  const data = snapshot.data();
  if (!data) {
    if (isOwner) setDoc(listDocRef, docPayload()).catch(() => {});
    return;
  }

  if (Array.isArray(data.items)) state.items = data.items;
  if (categories[data.activeCategory]) state.activeCategory = data.activeCategory;
  if (shareModes[data.activeShareMode]) state.activeShareMode = data.activeShareMode;
  if (["list", "grid"].includes(data.view)) state.view = data.view;
  render();
}

function showMode(mode) {
  document.body.dataset.mode = mode;
  Object.entries(screens).forEach(([name, screen]) => {
    screen.classList.toggle("is-active", name === mode);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setPasteStatus(message, tone = "normal") {
  pasteStatus.textContent = message;
  pasteStatus.dataset.tone = tone;
}

function waitWithTimeout(promise, milliseconds) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), milliseconds);
    }),
  ]);
}

function updateScreenshotPreview() {
  const hasScreenshot = Boolean(activeScreenshot);

  screenshotPreview.hidden = !hasScreenshot;
  if (!hasScreenshot) {
    screenshotThumb.removeAttribute("src");
    screenshotName.textContent = "已選擇截圖";
    return;
  }

  screenshotThumb.src = activeScreenshot.dataUrl;
  screenshotName.textContent = activeScreenshot.name || "已選擇截圖";
}

function acceptImageDataUrl(dataUrl, name = "貼上的商品圖片") {
  activeScreenshot = {
    name,
    dataUrl,
  };
  sourceInput.value = sourceInput.value || "商品截圖";
  formToast.textContent = "已加入截圖，請補商品名稱與分類";
  setPasteStatus("已讀到圖片，可以繼續補商品名稱。", "success");
  updateScreenshotPreview();
  titleInput.focus();
}

function openImageViewer(item) {
  if (!item?.imageDataUrl) return;

  imageViewerImg.src = item.imageDataUrl;
  imageViewerImg.alt = `${item.title}商品圖片`;
  imageViewerCaption.textContent = item.note || item.title;
  imageViewer.hidden = false;
  closeImageViewerButton.focus();
}

function closeImageViewer() {
  imageViewer.hidden = true;
  imageViewerImg.removeAttribute("src");
  imageViewerImg.removeAttribute("alt");
  imageViewerCaption.textContent = "";
}

function formatYen(value) {
  if (value === "" || value === null || Number.isNaN(Number(value))) return "未填";
  return `¥${Number(value).toLocaleString("ja-JP")}`;
}

function getScopedItems() {
  if (!state.activeStore) return [];
  return state.items.filter((item) => state.activeStore === "all" || item.store === state.activeStore);
}

function getFilteredItems() {
  const query = searchInput.value.trim().toLowerCase();
  const mustOnly = mustToggle.checked;

  return getScopedItems().filter((item) => {
    const categoryMatch = state.activeCategory === "all" || item.category === state.activeCategory;
    const priorityMatch = !mustOnly || item.priority === "must";
    const searchText = [item.title, item.note, item.source, stores[item.store], categories[item.category]]
      .join(" ")
      .toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    return categoryMatch && priorityMatch && searchMatch;
  });
}

function getPriceDelta(item) {
  if (item.spotPrice === "" || item.spotPrice === null) {
    return { text: "待比價", tone: "empty" };
  }

  const base = Number(item.basePrice);
  const current = Number(item.spotPrice);

  if (!base || Number.isNaN(current)) return { text: "已記錄", tone: "same" };
  if (current < base) return { text: `省 ${formatYen(base - current)}`, tone: "good" };
  if (current > base) return { text: `貴 ${formatYen(current - base)}`, tone: "bad" };
  return { text: "同價", tone: "same" };
}

function getVisualLabel(item) {
  return item.title.slice(0, 4);
}

function setActiveButton(buttons, value, key) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[key] === value);
  });
}

function updateStoreCounts() {
  const countText = (items) => {
    const done = items.filter((item) => item.done).length;
    return `${done}/${items.length} 件`;
  };

  Object.keys(stores).forEach((store) => {
    const items = store === "all" ? state.items : state.items.filter((item) => item.store === store);
    const target = document.querySelector(`[data-store-count="${store}"]`);
    if (target) target.textContent = countText(items);
  });
}

function updateCounts() {
  const scopedItems = getScopedItems();
  const done = scopedItems.filter((item) => item.done).length;

  doneCount.textContent = done;
  totalCount.textContent = scopedItems.length;
  progressRing.setAttribute("aria-label", `已買 ${done} 件，共 ${scopedItems.length} 件`);
}

function updateSelectedStore() {
  const hasStore = Boolean(state.activeStore);
  const storeName = stores[state.activeStore] || "尚未選擇";

  selectedStoreCopy.textContent = hasStore
    ? `目前查看：${storeName}。下方可以搜尋商品、篩選類別，或切換清單/圖卡。`
    : "選好店家後，下方才會顯示該店的搜尋、篩選與採買卡片。";
  listTitle.textContent = hasStore ? `${storeName}商品` : "待買商品";
  shopControls.hidden = !hasStore;
  sharePanel.hidden = !hasStore;
  listSection.hidden = !hasStore;
}

function updateSharePanel() {
  const params = new URLSearchParams();
  params.set("list", listId);
  if (state.activeShareMode === "readonly") params.set("mode", "readonly");
  shareModeCopy.textContent = shareModes[state.activeShareMode];
  shareLink.value = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function buildShareText() {
  const scopedItems = getScopedItems();
  const done = scopedItems.filter((item) => item.done).length;
  const targetItems = scopedItems.filter((item) => !item.done);
  const remainingText = targetItems.length
    ? targetItems.map((item) => `${item.title}（${categories[item.category]}）`).join("、")
    : "目前沒有待買商品";

  return `採買口袋清單｜${stores[state.activeStore]}\n進度：${done}/${scopedItems.length}\n模式：${shareModeLabels[state.activeShareMode]}\n待買：${remainingText}\n${shareLink.value}`;
}

function renderDraftList() {
  const recentItems = state.items.slice(-4).reverse();
  draftCount.textContent = `${state.items.length} 件`;
  draftList.innerHTML = recentItems
    .map(
      (item) => `
        <article class="draft-card">
          ${
            item.imageDataUrl
              ? `<div class="draft-thumb"><img src="${item.imageDataUrl}" alt="${escapeHtml(item.title)}截圖" /></div>`
              : ""
          }
          <span class="source-pill">${escapeHtml(item.source || "手動新增")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${stores[item.store]} · ${categories[item.category]} · ${item.priority === "must" ? "必買" : "看價格"}</p>
        </article>
      `,
    )
    .join("");
}

function renderCards() {
  const filteredItems = getFilteredItems().sort((a, b) => Number(a.done) - Number(b.done));

  list.dataset.view = state.view;
  list.innerHTML = filteredItems
    .map((item) => {
      const delta = getPriceDelta(item);
      const disabled = state.readonly ? "disabled" : "";
      const helpDisabled = state.readonly || item.done ? "disabled" : "";
      return `
        <article class="item-card ${item.done ? "is-done" : ""}" data-id="${item.id}">
          <label class="check-wrap">
            <input type="checkbox" ${item.done ? "checked" : ""} ${disabled} data-action="done" />
            <span>已買</span>
          </label>
          <div class="product-shot ${item.imageDataUrl ? "has-image" : item.visual}">
            ${
              item.imageDataUrl
                ? `<button class="image-button" type="button" data-action="preview-image" aria-label="放大查看${escapeHtml(item.title)}商品圖片"><img src="${item.imageDataUrl}" alt="${escapeHtml(item.title)}商品截圖" /></button>`
                : `<span>${escapeHtml(getVisualLabel(item))}</span>`
            }
          </div>
          <div class="item-body">
            <div class="item-title-row">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="badge ${item.priority}">${item.priority === "must" ? "必買" : "看價格"}</span>
            </div>
            <p class="note">${escapeHtml(item.note || "尚未填寫找貨備註。")}</p>
            <div class="meta-row">
              <span>店家：${stores[item.store]}</span>
              <span>類別：${categories[item.category]}</span>
              <span>來源：${escapeHtml(item.source || "手動新增")}</span>
              ${item.help ? "<span>請協尋</span>" : ""}
            </div>
            <div class="price-row">
              <div><small>蒐集價</small><strong>${formatYen(item.basePrice)}</strong></div>
              <label>
                <small>現場價</small>
                <input class="spot-price" type="number" value="${escapeHtml(item.spotPrice)}" placeholder="輸入" ${disabled} data-action="spot-price" />
              </label>
              <div class="delta ${delta.tone}">${delta.text}</div>
            </div>
            <div class="card-actions">
              <button type="button" ${helpDisabled} data-action="help">${item.help ? "取消協尋" : "請同行者找"}</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  visibleCount.textContent = `${filteredItems.length} 件`;
  emptyCopy.textContent = state.activeStore
    ? "換個商品類別、關掉必買篩選，或搜尋其他關鍵字。"
    : "先選上方商店，再開始找商品。";
  emptyState.hidden = filteredItems.length !== 0;
}

function renderReadonlyState() {
  document.body.classList.toggle("readonly-mode", state.readonly);
  shareButton.disabled = state.readonly;
  itemForm.querySelectorAll("input, select, textarea, button").forEach((input) => {
    input.disabled = state.readonly;
  });
  document.querySelectorAll(".import-actions button").forEach((button) => {
    button.disabled = state.readonly;
  });
  screenshotInput.disabled = state.readonly;
  pasteImageButton.disabled = state.readonly;
  imagePasteTarget.contentEditable = String(!state.readonly);
  if (state.readonly) {
    formToast.textContent = "你正在看只讀分享清單。";
  }
}

function render() {
  setActiveButton(storeFilters, state.activeStore, "store");
  setActiveButton(categoryFilters, state.activeCategory, "category");
  setActiveButton(viewButtons, state.view, "view");
  setActiveButton(shareModeButtons, state.activeShareMode, "shareMode");
  updateStoreCounts();
  updateCounts();
  updateSelectedStore();
  renderDraftList();
  renderCards();
  updateSharePanel();
  renderReadonlyState();
}

function makeNewItem(formData) {
  const title = formData.get("title").trim();
  const source = formData.get("source").trim();
  const note = formData.get("note").trim();

  return {
    id: `item-${Date.now()}`,
    title,
    store: formData.get("store"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    source,
    note,
    basePrice: formData.get("basePrice") || "",
    spotPrice: "",
    done: false,
    help: false,
    imageDataUrl: activeScreenshot?.dataUrl || "",
    visual: formData.get("category") === "snack" ? "snack" : formData.get("category") === "kids" ? "brush" : "powder",
  };
}

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.readonly) return;

  const formData = new FormData(itemForm);
  const item = makeNewItem(formData);

  state.items.push(item);
  state.activeStore = item.store;
  formToast.textContent = `已加入：${item.title}`;
  itemForm.reset();
  activeScreenshot = null;
  screenshotInput.value = "";
  imagePasteTarget.textContent = "點這裡後長按貼上圖片";
  setPasteStatus("如果按鈕沒反應，請點上方貼上區後長按貼上。");
  updateScreenshotPreview();
  saveState();
  render();
});

resetButton.addEventListener("click", () => {
  if (state.readonly) return;
  state.items = cloneSampleItems();
  state.activeStore = "all";
  state.activeCategory = "all";
  state.activeShareMode = "collab";
  state.view = "grid";
  localStorage.removeItem(STORAGE_KEY);
  formToast.textContent = "已重置為範例清單";
  render();
  saveState();
});

pasteUrlButton.addEventListener("click", () => {
  showMode("import");
  sourceInput.focus();
});

manualAddButton.addEventListener("click", () => {
  showMode("import");
  titleInput.focus();
});

clearScreenshotButton.addEventListener("click", () => {
  activeScreenshot = null;
  screenshotInput.value = "";
  imagePasteTarget.textContent = "點這裡後長按貼上圖片";
  setPasteStatus("如果按鈕沒反應，請點上方貼上區後長按貼上。");
  updateScreenshotPreview();
});

async function useImageBlob(blob, name = "貼上的商品圖片") {
  formToast.textContent = "正在準備截圖預覽...";
  setPasteStatus("正在準備圖片預覽...");

  try {
    activeScreenshot = {
      name,
      dataUrl: await fileToDataUrl(blob),
    };
    sourceInput.value = sourceInput.value || "商品截圖";
    formToast.textContent = "已加入截圖，請補商品名稱與分類";
    setPasteStatus("已讀到圖片，可以繼續補商品名稱。", "success");
    updateScreenshotPreview();
    titleInput.focus();
  } catch (error) {
    activeScreenshot = null;
    formToast.textContent = "這張圖片讀取失敗，請換一張試試";
    setPasteStatus("圖片讀取失敗，請換一張或改貼商品網址。", "error");
    updateScreenshotPreview();
  }
}

function getClipboardImageFile(dataTransfer) {
  const files = Array.from(dataTransfer?.files || []);
  const pastedFile = files.find((file) => file.type.startsWith("image/"));
  if (pastedFile) return pastedFile;

  const items = Array.from(dataTransfer?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  return imageItem?.getAsFile() || null;
}

async function usePastedImageFromTarget() {
  const image = imagePasteTarget.querySelector("img");
  const src = image?.getAttribute("src");
  if (!src) return false;

  imagePasteTarget.textContent = "已貼上圖片";

  if (src.startsWith("data:image/")) {
    acceptImageDataUrl(src);
    return true;
  }

  try {
    const response = await fetch(src);
    const blob = await response.blob();
    await useImageBlob(blob);
    return true;
  } catch (error) {
    setPasteStatus("這個瀏覽器貼上了圖片，但不允許讀取內容。請改用商品網址。", "error");
    return false;
  }
}

async function readClipboardImage() {
  setPasteStatus("正在檢查剪貼簿圖片...");

  if (!navigator.clipboard?.read) {
    imagePasteTarget.focus();
    setPasteStatus("這個瀏覽器不支援按鈕讀圖片，請點貼上區後長按貼上。", "error");
    formToast.textContent = "請點貼上區後長按貼上圖片";
    return;
  }

  try {
    const items = await waitWithTimeout(navigator.clipboard.read(), 1800);
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (!imageType) continue;

      const blob = await item.getType(imageType);
      await useImageBlob(blob, "剪貼簿圖片");
      imagePasteTarget.textContent = "已貼上圖片";
      return;
    }

    setPasteStatus("剪貼簿裡沒有圖片。請先在相簿或網頁複製圖片。", "error");
    formToast.textContent = "剪貼簿裡沒有圖片，請先在相簿或網頁複製圖片";
  } catch (error) {
    imagePasteTarget.focus();
    setPasteStatus("iPhone 目前不讓按鈕讀圖片，請點貼上區後長按貼上。", "error");
    formToast.textContent = "請點貼上區後長按貼上圖片";
  }
}

screenshotInput.addEventListener("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (file) useImageBlob(file, file.name);
});

pasteImageButton.addEventListener("click", readClipboardImage);

imagePasteTarget.addEventListener("focus", () => {
  if (!activeScreenshot) imagePasteTarget.textContent = "";
});

imagePasteTarget.addEventListener("blur", () => {
  if (!activeScreenshot && !imagePasteTarget.textContent.trim()) {
    imagePasteTarget.textContent = "點這裡後長按貼上圖片";
  }
});

imagePasteTarget.addEventListener("paste", (event) => {
  if (state.readonly) return;
  setPasteStatus("正在讀取貼上的內容...");

  const file = getClipboardImageFile(event.clipboardData);
  if (file) {
    event.preventDefault();
    useImageBlob(file, file.name || "貼上的商品圖片");
    imagePasteTarget.textContent = "已貼上圖片";
    return;
  }

  const text = event.clipboardData?.getData("text")?.trim();
  if (text) {
    event.preventDefault();
    sourceInput.value = text;
    setPasteStatus("已貼上來源文字。若要放商品圖，請在相簿或網頁複製圖片。");
    formToast.textContent = "已貼上來源文字，圖片可再另外複製貼上";
    return;
  }

  window.setTimeout(usePastedImageFromTarget, 0);
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => showMode(button.dataset.modeTarget));
});

storeFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeStore = button.dataset.store;
    saveState();
    render();
  });
});

categoryFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeCategory = button.dataset.category;
    saveState();
    render();
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    saveState();
    render();
  });
});

shareModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeShareMode = button.dataset.shareMode;
    saveState();
    render();
  });
});

list.addEventListener("input", (event) => {
  if (state.readonly || event.target.dataset.action !== "spot-price") return;
  const item = state.items.find((entry) => entry.id === event.target.closest(".item-card").dataset.id);
  item.spotPrice = event.target.value;
  saveState();
  const delta = getPriceDelta(item);
  const deltaNode = event.target.closest(".price-row").querySelector(".delta");
  deltaNode.className = `delta ${delta.tone}`;
  deltaNode.textContent = delta.text;
  updateSharePanel();
});

list.addEventListener("change", (event) => {
  if (state.readonly || event.target.dataset.action !== "done") return;
  const item = state.items.find((entry) => entry.id === event.target.closest(".item-card").dataset.id);
  item.done = event.target.checked;
  saveState();
  render();
});

list.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const action = actionTarget?.dataset.action;
  if (!action) return;

  const card = actionTarget.closest(".item-card");
  const item = state.items.find((entry) => entry.id === card.dataset.id);
  if (!item) return;

  if (action === "preview-image") {
    openImageViewer(item);
    return;
  }

  // 打勾(done)跟現場價輸入框(spot-price)各自有專屬的 change／input 監聽器處理。
  // 這裡如果還往下跑 render()，會在瀏覽器處理完打勾/輸入框 focus 前就把整個
  // DOM 換掉，導致打勾失效、輸入框點了沒反應。
  if (action === "done" || action === "spot-price") return;

  if (state.readonly) return;

  if (action === "help") {
    item.help = !item.help;
  }

  saveState();
  render();
});

closeImageViewerButton.addEventListener("click", closeImageViewer);

imageViewer.addEventListener("click", (event) => {
  if (event.target.dataset.action === "close-image-viewer") closeImageViewer();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imageViewer.hidden) closeImageViewer();
});

shareButton.addEventListener("click", async () => {
  const text = buildShareText();
  shareToast.textContent = "";

  try {
    if (navigator.share) {
      await navigator.share({
        title: "採買口袋清單",
        text,
        url: shareLink.value,
      });
      return;
    }

    await navigator.clipboard.writeText(text);
    shareToast.textContent = "已複製分享內容";
  } catch (error) {
    shareLink.select();
    document.execCommand("copy");
    shareToast.textContent = "已複製分享連結";
  }
});

searchInput.addEventListener("input", renderCards);
mustToggle.addEventListener("change", renderCards);

state.readonly = urlParams.get("mode") === "readonly";

if (isOwner) {
  loadState();
} else {
  state.items = [];
}

render();

onSnapshot(listDocRef, applyCloudSnapshot, () => {
  formToast.textContent = "雲端同步失敗，目前顯示本機清單";
});
