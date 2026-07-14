# 📚 單字卡 Vocabulary App

中英單字卡練習 PWA：手寫筆記照片一鍵轉單字卡（Gemini AI 辨識）、翻牌練習、選擇題測驗、間隔重複（SRS）。

單一 React 程式碼庫，同時是**網頁版**（GitHub Pages）與**手機 App**（加入主畫面即為全螢幕 App，離線可用）。

## 功能

- 📷 **圖片辨識匯入**：拍下手寫單字筆記，AI 自動抽取「英文 + 中文」成單字卡（支援雙欄筆記、片語、詞性標註，忽略劃掉的字）
- 📋 **文字批次匯入**：貼上「英文 中文」多行文字（tab / 逗號 / 空白分隔皆可）
- 🤖 **純英文清單**：只貼英文，AI 自動補繁中意思與詞性
- ✏️ **手動新增**、單字庫搜尋 / 編輯 / 刪除
- 🃏 **翻牌單字卡**（英→中 / 中→英 / 混合）
- ✅ **四選一選擇題測驗**
- 🔁 **間隔重複 SRS**（Leitner 5 盒：0/1/3/7/14 天）
- 💾 資料存於瀏覽器本地，可匯出 / 匯入 JSON 備份

## 使用前設定

1. 到 [Google AI Studio](https://aistudio.google.com/apikey) 免費申請 Gemini API key
2. 開啟 App →「設定」頁 → 貼上 API key →「測試連線」

> API key 只儲存在你裝置的瀏覽器（localStorage），不會上傳到任何伺服器；AI 功能由瀏覽器直接呼叫 Google API。

### ⚠️ API key 安全注意事項

- **不要在該 key 的 Google 專案綁定信用卡帳單**——沒綁帳單時 key 外洩最壞只是免費額度被用完；綁了才有盜刷風險（必須綁的話請設預算警示）
- **公用／共用電腦請勿輸入 API key**（key 以明文存在瀏覽器）；輸入過的話用完請在設定頁按「清除 API key」，並建議撤銷重發
- 建議到 Google Cloud Console 限制 key：僅允許 Generative Language API + HTTP referrer 限制（只允許本 App 網址）
- 裝置遺失或懷疑外洩時，立刻到 AI Studio 撤銷該 key 重發

## 本機開發

```bash
npm install
npm run dev      # 開發伺服器
npm test         # 單元測試
npm run build    # production build（輸出 dist/）
```

## 部署到 GitHub Pages

1. push 到 GitHub repo 的 `main` 分支
2. Repo 的 **Settings → Pages → Source** 選 **GitHub Actions**
3. `.github/workflows/deploy.yml` 會自動 build 並發布

> 若 repo 名稱不是 `Vocabulary_app`，請同步修改 `vite.config.ts` 的 `BASE`。

## 手機安裝（PWA）

- **Android（Chrome）**：開啟網址 → 選單 →「安裝應用程式」
- **iPhone（Safari）**：開啟網址 → 分享 →「加入主畫面」

安裝後為全螢幕 App，練習與單字庫離線可用（AI 辨識需網路）。
