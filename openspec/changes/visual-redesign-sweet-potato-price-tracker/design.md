## Context

當前的系統已遷移至 Express.js 與 SQLite，並展示趨勢分析的核心功能。目前，數據的可視化層級需要進一步精細化，以支援使用者對於「年度」、「月度」以及「特定年月」的深度探索。本設計將聚焦於前端 UI 的動態響應與 Chart.js 的進階視覺特效，並將通膨計算從圖表曲線簡化為純數字呈現。

## Goals / Non-Goals

**Goals:**
- **極簡與活力視覺升級**: 打造以 **白底 (White Background)** 為主的儀表板，運用 **橘黃發光點** 強化交互感。
- **三維度智能搜尋**: 支援「年」、「月」、「年月」查詢，圖表與表格同步響應。
- **管理模式動態化**: 在管理介面保留圖表，隨篩選結果即時連動。
- **通膨率純數字化**: 移除曲線繪製，改為在搜尋結果下方直接顯示「通膨率: ..%」。

**Non-Goals:**
- **大改 API 結構**: 維持現有的 RESTful 路由。
- **視覺冗餘**: 移除所有不必要的圖表疊加線條，保持趨勢圖單純。

## Decisions

### 1. 系統架構與分區 (Architecture & Zoning)
- **前端分區**: 導覽列切換「觀察模式 (Observer)」與「管理模式 (Management)」。
  - **觀察模式**: 10 年完整趨勢圖 + 智能搜尋框。
  - **數據呈現區 (圖表下方)**:
    - 搜尋結果表格 (單筆/年度/月份)。
    - **通膨資訊欄**: 顯示「通膨率: ..%」（僅在有明確年份/年月搜尋時出現）。
- **API 強化**:
  - GET /api/prices/search: 根據 query params (year, month) 返回數據與預計算的通膨率。

### 2. 數據庫架構 (Database Schema)
- **Table: prices**: 
  - id: INTEGER PRIMARY KEY
  - year: INTEGER (2016-2026) —— **欄位獨立儲存**
  - month: INTEGER (1-12) —— **欄位獨立儲存**
  - price: REAL
  - UNIQUE(year, month): 確保特定時間點僅有一筆數據。
- **Table: inflation_rates**: year, index_val（通膨指數原始值）。

### 3. 前端 UI 與 交互設計 (Frontend UI & UX)
- **Chart.js 進階特效**:
  - **高亮狀態**: 點徑放大 (Point Radius)，並加入 shadowBlur 製造橘黃色發光效果。
- **通膨顯示邏輯**:
  - 基準點設定為 2016 年。
  - 運算公式: ((TargetYearIndex / 2016YearIndex) - 1) * 100。
  - 顯示位置: 緊鄰搜尋出的價格表格，與價格數據並列。

### 4. 搜尋行為邏輯 (Search Logic)
- **解析器 (Parser)**:
  - Year + Month Dropdown: 前端將年月分開傳遞至後端 API。

## Risks / Trade-offs

- **[Trade-off] 移除實質價格曲線**: 雖然減少了資訊維度，但大幅提升了圖表的可讀性 (Simple & Clean)。
