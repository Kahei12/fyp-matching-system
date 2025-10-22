# 🚀 快速啟動指南

## 立即開始使用 React 版本

### 步驟 1: 啟動應用

```bash
npm run dev
```

這個命令會：
- ✅ 啟動後端服務器在 `http://localhost:3000`
- ✅ 啟動前端開發服務器在 `http://localhost:5173`

### 步驟 2: 訪問應用

在瀏覽器中打開: **http://localhost:5173**

### 步驟 3: 登入測試

使用以下任一帳號登入：

| 角色 | Email | 密碼 | 功能 |
|------|-------|------|------|
| 👨‍💼 Admin | admin@hkmu.edu.hk | admin123 | 項目審核、匹配控制 |
| 👨‍🎓 Student | student@hkmu.edu.hk | student123 | 瀏覽項目、選擇偏好 |
| 👨‍🏫 Teacher | teacher@hkmu.edu.hk | teacher123 | 教師功能（待開發） |

---

## 🎯 測試功能清單

### Student 界面測試
1. ✅ 登入為 student
2. ✅ 查看 Dashboard
3. ✅ 瀏覽所有項目
4. ✅ 使用搜索和過濾功能
5. ✅ 添加項目到偏好列表（最多5個）
6. ✅ 管理偏好順序
7. ✅ 提交偏好
8. ✅ 查看個人資料

### Admin 界面測試
1. ✅ 登入為 admin
2. ✅ 審核項目（批准/拒絕）
3. ✅ 查看匹配統計
4. ✅ 啟動匹配算法
5. ✅ 管理未分配學生
6. ✅ 設置截止日期

---

## 💡 開發提示

### 修改代碼後
- **前端改動**: 自動刷新（Vite HMR）
- **後端改動**: 自動重啟（nodemon）

### 停止服務器
按 `Ctrl+C` 停止正在運行的服務

### 單獨啟動
```bash
# 僅後端
npm run server:dev

# 僅前端
npm run client
```

---

## 🎨 主要改進

| 特性 | 舊版 | React 版 |
|------|------|----------|
| 架構 | 多個 HTML 文件 | 單頁應用（SPA） |
| 狀態管理 | DOM 操作 | React Hooks |
| 路由 | 服務器路由 | React Router |
| 開發體驗 | 手動刷新 | 熱重載 |
| 代碼組織 | 混合在一起 | 組件化 |
| 可維護性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 📂 重要文件位置

```
client/src/
├── pages/
│   ├── Login.jsx          # 登入頁面
│   ├── Student.jsx        # 學生主頁面
│   └── Admin.jsx          # 管理員主頁面
├── components/
│   ├── PrivateRoute.jsx   # 路由保護
│   └── Student/           # 學生頁面組件
└── App.jsx                # 路由配置
```

---

## ✅ 遷移完成檢查清單

- [x] React 項目結構創建
- [x] 所有頁面轉換為 React 組件
- [x] 路由系統配置
- [x] API 代理設置
- [x] 所有功能保持完整
- [x] 所有樣式保持一致
- [x] 啟動腳本配置
- [x] 文檔編寫完成

---

**🎉 恭喜！您的應用已成功遷移到 React！**

詳細文檔請查看: `README-REACT.md`

