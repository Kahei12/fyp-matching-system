# FYP Matching System - React 版本

## 📋 項目說明

這是一個「大學畢業專題匹配系統」，已成功從純 HTML/CSS/JavaScript 遷移到 React。

### 技術架構

- **前端**: React 18 + Vite
- **後端**: Node.js + Express
- **路由**: React Router v6
- **認證**: Session-based
- **數據**: JSON 模擬數據

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 安裝後端依賴
npm install

# 安裝前端依賴
cd client
npm install
cd ..
```

### 2. 啟動應用

#### 方式一：同時啟動前後端（推薦）

```bash
npm run dev
```

這會同時啟動：
- 後端服務器: `http://localhost:3000`
- 前端開發服務器: `http://localhost:5173`

#### 方式二：分別啟動

```bash
# 終端 1 - 啟動後端
npm run server:dev

# 終端 2 - 啟動前端
npm run client
```

### 3. 訪問應用

打開瀏覽器訪問: **http://localhost:5173**

## 🔑 測試帳號

### Admin（管理員）
- Email: `admin@hkmu.edu.hk`
- Password: `admin123`

### Student（學生）
- Email: `student@hkmu.edu.hk`
- Password: `student123`

### Teacher（教師）
- Email: `teacher@hkmu.edu.hk`
- Password: `teacher123`

## 📁 項目結構

```
FYP Matching System/
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/       # 可重用組件
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── Student/     # Student 頁面子組件
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProjectBrowse.jsx
│   │   │       ├── MyPreferences.jsx
│   │   │       ├── Results.jsx
│   │   │       ├── Profile.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/           # 頁面組件
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Student.jsx
│   │   │   ├── Student.css
│   │   │   ├── Admin.jsx
│   │   │   └── Admin.css
│   │   ├── App.jsx          # 主應用組件
│   │   ├── main.jsx         # React 入口
│   │   └── index.css        # 全局樣式
│   ├── index.html
│   ├── vite.config.js       # Vite 配置（含後端代理）
│   └── package.json
├── public/                   # 舊版靜態文件（保留作為參考）
├── services/                 # 後端服務
│   ├── studentService.js
│   └── mockData.js
├── data/
│   └── user.json
├── server.js                 # Express 後端服務器
├── package.json
└── README-REACT.md
```

## 🔄 從舊版遷移的變更

### 1. **前端架構**
- ✅ 純 HTML → React 組件
- ✅ 內聯 JavaScript → React Hooks (useState, useEffect)
- ✅ DOM 操作 → React 狀態管理
- ✅ 多個 HTML 文件 → 單頁應用 (SPA)

### 2. **路由系統**
- ✅ 服務器路由 → React Router
- ✅ 保護路由實現（PrivateRoute 組件）

### 3. **API 通信**
- ✅ 配置 Vite 代理轉發到後端
- ✅ 所有 API 調用保持不變

### 4. **樣式**
- ✅ 所有 CSS 完整保留
- ✅ 分離為組件級 CSS 文件

## 🎯 功能完整性

### ✅ Login 頁面
- 用戶登入
- 角色驗證（admin/student/teacher）
- Session 管理
- 錯誤提示

### ✅ Student 界面
- Dashboard（儀表板）
- Browse Projects（瀏覽項目 + 搜索過濾）
- My Preferences（偏好管理）
- Results（結果查看）
- Profile（個人資料）
- 完整的搜索和過濾功能

### ✅ Admin 界面
- Project Review（項目審核）
- Matching Control（匹配控制）
- Final Assignment（最終分配）
- Deadline Management（截止日期管理）

## 📝 可用的 NPM 腳本

```bash
npm run dev          # 同時啟動前後端開發服務器
npm run server       # 僅啟動後端（生產模式）
npm run server:dev   # 僅啟動後端（開發模式，帶 nodemon）
npm run client       # 僅啟動前端開發服務器
npm run build        # 構建前端生產版本
npm start            # 啟動後端生產服務器
```

## 🔧 開發注意事項

1. **前端開發端口**: 5173 (Vite 默認)
2. **後端 API 端口**: 3000
3. **API 代理**: 前端請求會自動代理到 `http://localhost:3000`
4. **熱重載**: 
   - 前端修改自動刷新（Vite HMR）
   - 後端修改自動重啟（nodemon）

## 🌟 遷移優勢

1. ✅ **組件化**: 代碼更易維護和重用
2. ✅ **狀態管理**: React Hooks 提供更好的狀態管理
3. ✅ **開發體驗**: 熱重載、更好的錯誤提示
4. ✅ **性能**: 虛擬 DOM 和優化的渲染
5. ✅ **擴展性**: 更容易添加新功能和頁面
6. ✅ **類型安全**: 未來可輕鬆添加 TypeScript

## 🐛 常見問題

### Q: 前端無法連接後端 API？
A: 確保後端服務器在 3000 端口運行，Vite 配置中已設置代理。

### Q: 登入後頁面跳轉失敗？
A: 檢查 sessionStorage 是否正確保存了登入狀態。

### Q: CSS 樣式沒有生效？
A: 確保在組件中正確導入了對應的 CSS 文件。

## 📞 支持

如有問題，請檢查：
1. 所有依賴是否正確安裝
2. 端口 3000 和 5173 是否被占用
3. Node.js 版本是否 >= 16

---

**開發完成日期**: 2025-10-22
**版本**: 2.0.0 (React)

