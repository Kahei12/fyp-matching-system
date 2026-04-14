# MongoDB Integration Guide

For future development when moving to production.

## Current Status

Current implementation uses in-memory storage. Data is lost when server restarts. Suitable for development and testing only.

## Target State

Production version with MongoDB for data persistence. Supports 30-50 users.

## Migration Steps

### 1. Install Dependencies

```bash
npm install mongoose dotenv
```

### 2. Create User Model

Create `models/User.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student', 'teacher'], required: true },
    name: { type: String, required: true },
    studentId: { type: String, sparse: true },
    gpa: { type: Number, min: 0, max: 4.0 },
    major: String,
    department: String,
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 3. Connect to MongoDB

Update `server.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const User = require('./models/User');
```

### 4. Environment Variables

Create `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/fyp-matching-system
PORT=3000
```

### 5. Update Login API

Replace in-memory lookup with database queries:

```javascript
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
        success: true,
        user: {
            email: user.email,
            role: user.role,
            name: user.name
        }
    });
});
```

### 6. Admin User Management APIs

```javascript
// Create user
app.post('/api/admin/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.json({ success: true, user });
});

// Get all users
app.get('/api/admin/users', async (req, res) => {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
});

// Delete user
app.delete('/api/admin/users/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Update user
app.put('/api/admin/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    ).select('-password');
    res.json({ success: true, user });
});
```

### 7. Initialize Database

Create `scripts/initDB.js`:

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');

async function init() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create admin
    await User.create({
        email: 'admin@hkmu.edu.hk',
        password: 'admin123',
        role: 'admin',
        name: 'Admin'
    });

    console.log('Database initialized');
    await mongoose.disconnect();
}

init();
```

Run once:

```bash
node scripts/initDB.js
```

## Notes

- This guide is for reference when you are ready to deploy to production
- All current development uses in-memory data
- MongoDB provides persistence and scalability
- Consider using MongoDB Atlas for cloud hosting

---

Last updated: 2025-10-23
