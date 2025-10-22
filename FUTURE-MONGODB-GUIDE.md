# 🗄️ MongoDB 集成指南（未來開發）

## 📋 當前狀態 vs 未來規劃

### 當前（開發階段）
```javascript
// server.js - 內存存儲
let users = [
    { email: 'admin@hkmu.edu.hk', password: '...', role: 'admin' },
    { email: 'student@hkmu.edu.hk', password: '...', role: 'student' },
    { email: 'teacher@hkmu.edu.hk', password: '...', role: 'teacher' }
];
```
- ⚠️ 服務器重啟後數據丟失
- ⚠️ 無法動態添加用戶
- ✅ 適合開發測試

### 未來（生產階段）
```javascript
// MongoDB 存儲
User.find({ role: 'student' })  // 查詢學生
User.create({ email, password, role })  // 創建用戶
```
- ✅ 數據持久化
- ✅ 支持動態用戶管理
- ✅ 適合生產環境

---

## 🎯 預計用戶規模

| 角色 | 數量 | 說明 |
|------|------|------|
| 管理員 (Admin) | 1 | 系統管理、審核項目 |
| 學生 (Student) | ~30 | 選擇 FYP 項目 |
| 教師 (Teacher) | ~10 | 提供 FYP 項目 |
| **總計** | **~41** | 可輕鬆擴展 |

MongoDB 非常適合這個規模（從幾十到數百萬都可以）。

---

## 📦 步驟 1：安裝 MongoDB 依賴

```bash
# 安裝 mongoose（MongoDB ODM）
npm install mongoose

# 安裝 dotenv（環境變量管理）
npm install dotenv
```

---

## 📝 步驟 2：創建用戶模型

創建 `models/User.js`：

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'teacher'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    
    // Student 專屬欄位
    studentId: {
        type: String,
        sparse: true  // 只有 student 需要
    },
    gpa: {
        type: Number,
        min: 0,
        max: 4.0
    },
    major: String,
    year: String,
    
    // Teacher 專屬欄位
    department: String,
    title: String,  // Dr., Prof., etc.
    
    // 通用欄位
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// 保存前自動加密密碼
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 驗證密碼方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

## 🔧 步驟 3：連接 MongoDB

修改 `server.js`：

```javascript
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 連接成功'))
.catch(err => console.error('❌ MongoDB 連接失敗:', err));

// 引入 User 模型
const User = require('./models/User');

// ... 其他代碼
```

---

## 🔐 步驟 4：環境變量配置

創建 `.env` 文件：

```env
# MongoDB 連接字符串
MONGODB_URI=mongodb://localhost:27017/fyp-matching-system

# 或使用 MongoDB Atlas（雲端）
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fyp-matching-system

# 服務器端口
PORT=3000

# JWT Secret（如果使用 JWT）
JWT_SECRET=your-super-secret-key-change-this
```

**⚠️ 重要：** 將 `.env` 加入 `.gitignore`

---

## 🎨 步驟 5：修改登入 API

```javascript
// 新的登入 API（使用 MongoDB）
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 從數據庫查找用戶
        const user = await User.findOne({ email, isActive: true });
        
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'Email or password is incorrect' 
            });
        }
        
        // 驗證密碼
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.json({ 
                success: false, 
                message: 'Email or password is incorrect' 
            });
        }
        
        // 登入成功
        res.json({
            success: true,
            message: `Login successful! Welcome, ${user.role}.`,
            user: {
                email: user.email,
                role: user.role,
                name: user.name,
                studentId: user.studentId,
                gpa: user.gpa,
                major: user.major,
                redirectTo: getRedirectPage(user.role)
            }
        });
        
    } catch (error) {
        console.error('登入錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});
```

---

## 👥 步驟 6：添加用戶管理 API（Admin 功能）

```javascript
// ==================== Admin API ====================

// 創建用戶（Admin 專用）
app.post('/api/admin/users', async (req, res) => {
    try {
        const { email, password, role, name, ...otherData } = req.body;
        
        // 檢查郵箱是否已存在
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        // 創建新用戶
        const newUser = new User({
            email,
            password,  // 會自動加密（pre-save hook）
            role,
            name,
            ...otherData
        });
        
        await newUser.save();
        
        res.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name
            }
        });
        
    } catch (error) {
        console.error('創建用戶錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create user' 
        });
    }
});

// 獲取所有用戶列表（Admin 專用）
app.get('/api/admin/users', async (req, res) => {
    try {
        const { role } = req.query;  // 可選：按角色過濾
        
        const query = role ? { role } : {};
        const users = await User.find(query)
            .select('-password')  // 不返回密碼
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            users
        });
        
    } catch (error) {
        console.error('獲取用戶列表錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch users' 
        });
    }
});

// 刪除用戶（Admin 專用）
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await User.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('刪除用戶錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user' 
        });
    }
});

// 更新用戶信息（Admin 專用）
app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // 如果更新密碼，需要先加密
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('更新用戶錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user' 
        });
    }
});
```

---

## 🎨 步驟 7：React Admin 組件（用戶管理）

創建 `client/src/components/Admin/UserManagement.jsx`：

```jsx
import React, { useState, useEffect } from 'react';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'student',
        name: '',
        studentId: '',
        gpa: '',
        major: ''
    });

    // 載入用戶列表
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();
            if (result.success) {
                setUsers(result.users);
            }
        } catch (error) {
            console.error('載入用戶失敗:', error);
        }
    };

    // 創建用戶
    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ 用戶創建成功！');
                setShowCreateForm(false);
                loadUsers();
                // 重置表單
                setFormData({
                    email: '',
                    password: '',
                    role: 'student',
                    name: '',
                    studentId: '',
                    gpa: '',
                    major: ''
                });
            } else {
                alert('❌ ' + result.message);
            }
        } catch (error) {
            console.error('創建用戶失敗:', error);
            alert('❌ 創建用戶失敗');
        }
    };

    // 刪除用戶
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('確定要刪除此用戶嗎？')) return;
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ 用戶已刪除');
                loadUsers();
            }
        } catch (error) {
            console.error('刪除用戶失敗:', error);
        }
    };

    return (
        <div className="user-management">
            <h2>用戶管理</h2>
            
            <button onClick={() => setShowCreateForm(!showCreateForm)}>
                ➕ 創建新用戶
            </button>

            {showCreateForm && (
                <form onSubmit={handleCreateUser} className="create-user-form">
                    <h3>創建新用戶</h3>
                    
                    <select 
                        value={formData.role} 
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        required
                    >
                        <option value="student">學生</option>
                        <option value="teacher">教師</option>
                        <option value="admin">管理員</option>
                    </select>

                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />

                    <input
                        type="password"
                        placeholder="密碼"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />

                    <input
                        type="text"
                        placeholder="姓名"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />

                    {formData.role === 'student' && (
                        <>
                            <input
                                type="text"
                                placeholder="學生 ID"
                                value={formData.studentId}
                                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="GPA"
                                value={formData.gpa}
                                onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                            />
                            <input
                                type="text"
                                placeholder="專業"
                                value={formData.major}
                                onChange={(e) => setFormData({...formData, major: e.target.value})}
                            />
                        </>
                    )}

                    <button type="submit">創建</button>
                    <button type="button" onClick={() => setShowCreateForm(false)}>取消</button>
                </form>
            )}

            <div className="users-table">
                <h3>用戶列表 ({users.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>角色</th>
                            <th>姓名</th>
                            <th>Email</th>
                            <th>創建時間</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.role}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => handleDeleteUser(user._id)}>
                                        🗑️ 刪除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;
```

---

## 📊 步驟 8：初始化數據庫

創建初始管理員帳號（只運行一次）：

```javascript
// scripts/initDB.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function initializeDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 創建管理員帳號
        const admin = await User.create({
            email: 'admin@hkmu.edu.hk',
            password: 'admin123',  // 會自動加密
            role: 'admin',
            name: 'Admin Wang'
        });
        
        console.log('✅ 管理員帳號創建成功:', admin.email);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ 初始化失敗:', error);
        process.exit(1);
    }
}

initializeDatabase();
```

運行初始化：
```bash
node scripts/initDB.js
```

---

## 🔒 步驟 9：添加認證中間件（可選）

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };
```

---

## 📋 完整遷移檢查清單

### 準備階段
- [ ] 安裝 MongoDB（本地或 Atlas）
- [ ] 安裝依賴：`mongoose`, `dotenv`
- [ ] 創建 `.env` 文件

### 開發階段
- [ ] 創建 User 模型 (`models/User.js`)
- [ ] 修改 `server.js` 連接 MongoDB
- [ ] 更新登入 API
- [ ] 添加用戶管理 API（CRUD）
- [ ] 創建 React 用戶管理組件
- [ ] 測試所有功能

### 部署階段
- [ ] 設置 MongoDB Atlas（雲端）
- [ ] 配置生產環境變量
- [ ] 運行初始化腳本
- [ ] 部署應用

---

## 🎯 總結

### 當前（開發階段）
```
✅ 內存存儲（3 個測試帳號）
✅ 適合開發和測試
```

### 未來（集成 MongoDB 後）
```
✅ 數據持久化
✅ 支持 30+ 學生、10+ 教師
✅ Admin 可動態管理用戶
✅ 可擴展到數百用戶
```

---

**這份指南保存在項目中，當你準備集成 MongoDB 時可以直接參考！** 📚

