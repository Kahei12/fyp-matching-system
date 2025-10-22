# 📁 FYP Matching System - 項目結構

## 當前項目結構（React 版本）

```
FYP Matching System/
│
├── 📂 client/                          # React 前端應用
│   ├── 📂 src/
│   │   ├── 📂 components/             # 可重用組件
│   │   │   ├── PrivateRoute.jsx      # 路由保護組件
│   │   │   └── 📂 Student/           # Student 頁面子組件
│   │   │       ├── Sidebar.jsx       # 側邊欄
│   │   │       ├── Dashboard.jsx     # 儀表板
│   │   │       ├── ProjectBrowse.jsx # 項目瀏覽
│   │   │       ├── MyPreferences.jsx # 偏好管理
│   │   │       ├── Results.jsx       # 結果查看
│   │   │       └── Profile.jsx       # 個人資料
│   │   │
│   │   ├── 📂 pages/                 # 頁面組件
│   │   │   ├── Login.jsx             # 登入頁面
│   │   │   ├── Login.css             # 登入樣式
│   │   │   ├── Student.jsx           # 學生主頁面
│   │   │   ├── Student.css           # 學生樣式
│   │   │   ├── Admin.jsx             # 管理員主頁面
│   │   │   └── Admin.css             # 管理員樣式
│   │   │
│   │   ├── App.jsx                   # 主應用 + 路由配置
│   │   ├── main.jsx                  # React 入口文件
│   │   └── index.css                 # 全局樣式
│   │
│   ├── index.html                     # HTML 模板
│   ├── vite.config.js                 # Vite 配置（含 API 代理）
│   ├── package.json                   # 前端依賴
│   ├── package-lock.json              # 依賴鎖定
│   └── .gitignore                     # Git 忽略配置
│
├── 📂 legacy-html-version/            # ⚠️ 舊版備份（僅供參考）
│   ├── admin.html                    # 舊版管理員頁面
│   ├── admin.css                     # 舊版管理員樣式
│   ├── admin.js                      # 舊版管理員邏輯
│   ├── student.html                  # 舊版學生頁面
│   ├── student.css                   # 舊版學生樣式
│   ├── student.js                    # 舊版學生邏輯
│   ├── login.html                    # 舊版登入頁面
│   ├── login.css                     # 舊版登入樣式
│   ├── login.js                      # 舊版登入邏輯
│   └── README.md                     # 舊版說明文檔
│
├── 📂 services/                       # 後端服務層
│   ├── studentService.js             # 學生服務（API 邏輯）
│   └── mockData.js                   # 模擬數據
│
├── 📂 data/                           # 數據存儲
│   └── user.json                     # 用戶數據（JSON）
│
├── 📂 node_modules/                   # Node.js 依賴（自動生成）
│
├── server.js                          # Express 後端服務器
├── package.json                       # 根項目配置
├── package-lock.json                  # 依賴鎖定文件
│
├── 📖 README-REACT.md                 # React 版本完整文檔
├── 📖 QUICK-START.md                  # 快速開始指南
├── 📖 MIGRATION-SUMMARY.md            # 遷移詳細報告
└── 📖 PROJECT-STRUCTURE.md            # 本文件 - 項目結構說明

```

---

## 🎯 核心文件說明

### 前端入口
- **`client/index.html`** - HTML 入口模板
- **`client/src/main.jsx`** - React 應用入口
- **`client/src/App.jsx`** - 路由配置 + 主應用組件

### 頁面組件
1. **Login** (`pages/Login.jsx`)
   - 用戶登入
   - 角色驗證
   - Session 管理

2. **Student** (`pages/Student.jsx`)
   - 儀表板
   - 項目瀏覽（含搜索過濾）
   - 偏好管理
   - 結果查看
   - 個人資料

3. **Admin** (`pages/Admin.jsx`)
   - 項目審核
   - 匹配控制
   - 最終分配
   - 截止日期管理

### 後端服務
- **`server.js`** - Express 服務器，提供 API
- **`services/studentService.js`** - 業務邏輯層
- **`services/mockData.js`** - 模擬數據生成

### 配置文件
- **`client/vite.config.js`** - Vite 配置（重要：API 代理設置）
- **`package.json`** - 項目腳本和依賴管理

---

## 🗂️ 文件夾用途

| 文件夾 | 用途 | 狀態 |
|--------|------|------|
| `client/` | React 前端應用 | ✅ 使用中 |
| `client/src/pages/` | 頁面級組件 | ✅ 使用中 |
| `client/src/components/` | 可重用組件 | ✅ 使用中 |
| `services/` | 後端業務邏輯 | ✅ 使用中 |
| `data/` | JSON 數據存儲 | ✅ 使用中 |
| `legacy-html-version/` | 舊版備份 | ⚠️ 僅供參考 |
| `node_modules/` | 依賴包 | 🔄 自動管理 |

---

## 🚀 啟動流程

### 開發模式
```bash
npm run dev
```

**執行流程：**
1. 啟動 Express 後端（端口 3000）
2. 啟動 Vite 開發服務器（端口 5173）
3. Vite 代理 `/api` 和 `/login` 請求到後端
4. 瀏覽器訪問 `http://localhost:5173`

### 請求流程
```
瀏覽器 (5173)
    ↓
Vite Dev Server
    ↓ (代理 /api, /login)
Express Server (3000)
    ↓
Services Layer
    ↓
Mock Data / JSON
```

---

## 📦 依賴說明

### 根項目 (package.json)
```json
{
  "dependencies": {
    "bcryptjs": "密碼加密",
    "express": "後端服務器"
  },
  "devDependencies": {
    "nodemon": "自動重啟",
    "concurrently": "同時運行前後端"
  }
}
```

### 前端 (client/package.json)
```json
{
  "dependencies": {
    "react": "UI 框架",
    "react-dom": "DOM 渲染",
    "react-router-dom": "客戶端路由"
  },
  "devDependencies": {
    "vite": "構建工具",
    "@vitejs/plugin-react": "React 插件"
  }
}
```

---

## 🔄 代碼流轉

### 前端狀態流
```
用戶操作
    ↓
React 事件處理
    ↓
setState (React Hooks)
    ↓
fetch API 調用
    ↓
後端 API
    ↓
返回數據
    ↓
更新組件狀態
    ↓
重新渲染 UI
```

### 路由保護流
```
訪問受保護路由
    ↓
PrivateRoute 組件
    ↓
檢查 sessionStorage
    ↓ (已登入)
顯示目標頁面
    ↓ (未登入)
重定向到 Login
```

---

## 📝 重要文件內容速查

### vite.config.js（API 代理配置）
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
  '/login': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

### App.jsx（路由配置）
```javascript
<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/student" element={
    <PrivateRoute role="student">
      <Student />
    </PrivateRoute>
  } />
  <Route path="/admin" element={
    <PrivateRoute role="admin">
      <Admin />
    </PrivateRoute>
  } />
</Routes>
```

---

## 🎨 樣式架構

### 全局樣式
- `client/src/index.css` - 基礎重置 + 全局樣式

### 組件樣式
- `Login.css` - 登入頁面專用
- `Student.css` - 學生界面專用（含所有子組件）
- `Admin.css` - 管理員界面專用

**特點：**
- ✅ 保留所有原有樣式
- ✅ 按頁面分離 CSS
- ✅ 響應式設計完整保留
- ✅ 無 CSS-in-JS，使用傳統 CSS

---

## 🔐 認證流程

### Session 管理
```javascript
// 登入後儲存
sessionStorage.setItem('isLoggedIn', 'true');
sessionStorage.setItem('userRole', 'student');

// 路由保護檢查
const isLoggedIn = sessionStorage.getItem('isLoggedIn');
const userRole = sessionStorage.getItem('userRole');
```

---

## 🗑️ 舊版處理

### legacy-html-version/ 文件夾
- **用途**: 備份舊版 HTML/CSS/JS 文件
- **狀態**: 僅供參考，不再使用
- **建議**: 確認 React 版本運行正常後可刪除

---

## 📊 代碼統計

| 類型 | 數量 | 說明 |
|------|------|------|
| React 組件 | 13 個 | Login, Student, Admin + 子組件 |
| 頁面 | 3 個 | Login, Student, Admin |
| CSS 文件 | 4 個 | 全局 + 3 個頁面樣式 |
| 服務文件 | 2 個 | studentService + mockData |
| 配置文件 | 3 個 | vite.config + 2 個 package.json |

---

## 🎯 下一步擴展

如需添加新功能，建議位置：

### 新頁面
- 創建 `pages/NewPage.jsx`
- 添加對應 CSS
- 在 `App.jsx` 中配置路由

### 新組件
- 創建 `components/NewComponent.jsx`
- 在需要的頁面中引入使用

### 新 API
- 在 `services/` 中添加新服務
- 在 `server.js` 中註冊新路由

---

**更新日期**: 2025-10-23  
**版本**: 2.0.0 (React)  
**狀態**: ✅ 生產就緒

