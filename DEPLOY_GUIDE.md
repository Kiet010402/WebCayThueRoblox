# Hướng Dẫn Deploy Website Lên Production

## Tổng Quan
Website này có 2 phần:
- **Backend (Server)**: Node.js + Express API
- **Frontend (Client)**: React App
- **Database**: MongoDB (cần dùng MongoDB Atlas - cloud)

---

## Bước 1: Setup MongoDB Atlas (Cloud Database)

1. **Đăng ký MongoDB Atlas** (miễn phí):
   - Truy cập: https://www.mongodb.com/cloud/atlas
   - Đăng ký tài khoản (hoặc đăng nhập)
   - Tạo cluster mới (chọn FREE tier)

2. **Tạo Database User**:
   - Vào "Database Access" → "Add New Database User"
   - Username: `admin` (hoặc tên bạn muốn)
   - Password: Tạo password mạnh
   - Database User Privileges: "Atlas admin"
   - Click "Add User"

3. **Whitelist IP Address**:
   - Vào "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) để cho phép kết nối từ mọi nơi
   - Hoặc thêm IP cụ thể của server bạn

4. **Lấy Connection String**:
   - Vào "Database" → Click "Connect"
   - Chọn "Connect your application"
   - Copy connection string, ví dụ:
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Thay `<password>` bằng password bạn đã tạo

---

## Bước 2: Deploy Backend (Server)

### Option 1: Render.com (Đề xuất - Miễn phí)

1. **Đăng ký Render**:
   - Truy cập: https://render.com
   - Đăng ký bằng GitHub (khuyến nghị) hoặc email

2. **Tạo Web Service**:
   - Click "New" → "Web Service"
   - Connect repository GitHub của bạn (hoặc deploy từ Git)
   - Hoặc chọn "Deploy manually"

3. **Cấu hình** (QUAN TRỌNG - Đọc kỹ):
   - **Name**: `roblox-shop-api` (hoặc tên bạn muốn)
   - **Root Directory**: `server` ⚠️ **BẮT BUỘC** - Phải set là `server` vì `package.json` nằm trong thư mục này
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `5000` (hoặc port Render cung cấp)
   
   **Lưu ý**: Nếu không set Root Directory = `server`, Render sẽ tìm `package.json` ở thư mục gốc và báo lỗi "ENOENT: no such file or directory"

4. **Environment Variables** (trong Render Dashboard):
   ```
   MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/roblox-shop?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key-here-make-it-long-and-random
   FRONTEND_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   PORT=5000
   ```
   
   **Lưu ý**: 
   - Thay `yourpassword` bằng password MongoDB Atlas của bạn
   - Thay `your-frontend.vercel.app` bằng URL frontend thực tế (sẽ set sau khi deploy frontend)
   - `JWT_SECRET` nên là chuỗi ngẫu nhiên dài (ví dụ: dùng `openssl rand -hex 32` để generate)

5. **Deploy**:
   - Click "Create Web Service"
   - Render sẽ tự động build và deploy
   - Lấy URL backend (ví dụ: `https://roblox-shop-api.onrender.com`)

### Option 2: Railway.app

1. Đăng ký: https://railway.app
2. Tạo project mới
3. Deploy từ GitHub hoặc upload code
4. Thêm environment variables tương tự như trên
5. Railway sẽ tự động cung cấp URL

### Option 3: VPS (DigitalOcean, AWS, v.v.)

1. Mua VPS (tối thiểu 1GB RAM)
2. SSH vào server
3. Cài đặt Node.js, npm
4. Clone code lên server
5. Cài đặt PM2 để chạy server:
   ```bash
   npm install -g pm2
   cd server
   npm install
   pm2 start server.js --name roblox-shop-api
   pm2 save
   pm2 startup
   ```
6. Cấu hình Nginx làm reverse proxy (tùy chọn)

---

## Bước 3: Deploy Frontend (Client)

### Option 1: Vercel (Đề xuất - Miễn phí)

1. **Đăng ký Vercel**:
   - Truy cập: https://vercel.com
   - Đăng ký bằng GitHub

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import repository GitHub của bạn
   - Hoặc upload folder `client`

3. **Cấu hình**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy**:
   - Click "Deploy"
   - Vercel sẽ tự động build và deploy
   - Lấy URL frontend (ví dụ: `https://roblox-shop.vercel.app`)

### Option 2: Netlify (Miễn phí - Tốt cho React)

1. **Đăng ký Netlify**:
   - Truy cập: https://netlify.com
   - Đăng ký bằng GitHub

2. **Import Project**:
   - Click "Add new site" → "Import an existing project"
   - Connect repository GitHub của bạn

3. **Cấu hình**:
   - **Base directory**: `client`
   - **Build command**: `npm install && npm run build` ⚠️ **QUAN TRỌNG** - Phải có `npm install` trước
   - **Publish directory**: `build` (không có `client/` ở đầu)
   
   **Hoặc tạo file `netlify.toml` trong thư mục `client/`:**
   ```toml
   [build]
     base = "client"
     command = "npm install && npm run build"
     publish = "build"
   ```

4. **Environment Variables**:
   - Click "Site settings" → "Environment variables"
   - Thêm: `REACT_APP_API_URL` = `https://kaihonshop.onrender.com`

5. **Deploy**:
   - Click "Deploy site"
   - Netlify sẽ tự động build và deploy
   - URL sẽ là: `https://your-site-name.netlify.app`

### Option 3: Render (Cùng platform với backend - Dễ quản lý)

1. **Tạo Static Site trên Render**:
   - Vào Render Dashboard
   - Click "New" → "Static Site"

2. **Cấu hình**:
   - **Name**: `roblox-shop-frontend`
   - **Repository**: Chọn repository GitHub của bạn
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

3. **Environment Variables**:
   - Thêm: `REACT_APP_API_URL` = `https://kaihonshop.onrender.com`

4. **Deploy**:
   - Click "Create Static Site"
   - Render sẽ tự động build và deploy
   - URL sẽ là: `https://your-site-name.onrender.com`

### Option 4: Railway (Miễn phí - Dễ dùng)

1. **Đăng ký Railway**:
   - Truy cập: https://railway.app
   - Đăng ký bằng GitHub

2. **Tạo Project**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Chọn repository của bạn

3. **Cấu hình**:
   - Railway sẽ tự detect React app
   - Set **Root Directory**: `client`
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npx serve -s build` (cần install serve)

4. **Environment Variables**:
   - Thêm: `REACT_APP_API_URL` = `https://kaihonshop.onrender.com`

5. **Deploy**:
   - Railway sẽ tự động deploy
   - URL sẽ được cung cấp tự động

### Option 5: GitHub Pages (Miễn phí - Đơn giản)

1. **Build React App**:
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Cấu hình package.json**:
   Thêm vào `client/package.json`:
   ```json
   "homepage": "https://your-username.github.io/Web",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Environment Variables**:
   - Tạo file `.env.production` trong `client/`:
   ```
   REACT_APP_API_URL=https://kaihonshop.onrender.com
   ```

### Option 6: Firebase Hosting (Miễn phí - Google)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login và Init**:
   ```bash
   firebase login
   cd client
   firebase init hosting
   ```

3. **Cấu hình**:
   - **Public directory**: `build`
   - **Single-page app**: Yes
   - **Build command**: `npm run build`

4. **Environment Variables**:
   - Tạo file `.env.production` trong `client/`:
   ```
   REACT_APP_API_URL=https://kaihonshop.onrender.com
   ```

5. **Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

### Option 7: Build và Deploy Manual

1. **Build React App**:
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Upload folder `build`** lên hosting:
   - GitHub Pages
   - Firebase Hosting
   - AWS S3 + CloudFront
   - Hoặc bất kỳ static hosting nào

---

## Bước 4: Cập nhật Code

### 1. Frontend đã được cấu hình sẵn

File `client/src/api/axios.js` đã được tạo để tự động sử dụng `REACT_APP_API_URL`.

**Trong development (localhost):**
- Không cần set `REACT_APP_API_URL`
- Proxy trong `package.json` sẽ tự động chuyển request đến backend

**Trong production:**
- Set environment variable `REACT_APP_API_URL` trong hosting (Vercel/Netlify)
- Ví dụ: `REACT_APP_API_URL=https://your-backend-url.onrender.com`

### 2. Backend CORS đã được cấu hình

File `server/server.js` đã được cập nhật để hỗ trợ CORS với `FRONTEND_URL`.

**Environment Variables cần set trong Backend hosting:**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend.vercel.app
PORT=5000
```

### 3. Cập nhật các file sử dụng axios (Tùy chọn)

Nếu muốn, bạn có thể cập nhật các file để dùng `api` từ `client/src/api/axios.js` thay vì `axios` trực tiếp:

```javascript
// Thay vì:
import axios from 'axios';
axios.get('/api/users/me')

// Dùng:
import api from '../api/axios';
api.get('/api/users/me')
```

**Lưu ý:** Code hiện tại vẫn hoạt động tốt với proxy trong development và sẽ tự động dùng `REACT_APP_API_URL` trong production nếu được set.

---

## Bước 5: Kiểm Tra

1. **Test Backend**:
   - Truy cập: `https://your-backend-url.onrender.com/api/products`
   - Nếu thấy JSON response → Backend OK

2. **Test Frontend**:
   - Truy cập URL frontend
   - Thử đăng ký/đăng nhập
   - Kiểm tra các chức năng

3. **Kiểm tra Console**:
   - Mở Developer Tools (F12)
   - Xem có lỗi CORS hoặc API không

---

## Lưu Ý Quan Trọng

1. **Security**:
   - Đừng commit file `.env` lên GitHub
   - Dùng environment variables trong hosting
   - JWT_SECRET phải là chuỗi ngẫu nhiên dài

2. **Performance**:
   - Enable gzip compression
   - Sử dụng CDN cho static files
   - Optimize images

3. **Monitoring**:
   - Setup error tracking (Sentry, LogRocket)
   - Monitor server logs
   - Setup uptime monitoring

4. **Backup**:
   - Backup MongoDB định kỳ
   - Backup code trên GitHub

---

## Troubleshooting

### ❌ Lỗi: "ENOENT: no such file or directory, open '/opt/render/project/src/package.json'"
**Nguyên nhân**: Render không tìm thấy `package.json` vì Root Directory chưa được set đúng.

**Giải pháp**:
1. Vào Render Dashboard → Chọn service của bạn
2. Vào tab "Settings"
3. Tìm mục "Root Directory"
4. Set giá trị là: `server` (không có dấu `/` ở đầu)
5. Click "Save Changes"
6. Render sẽ tự động redeploy

### Lỗi CORS
- Kiểm tra CORS settings trong backend
- Đảm bảo FRONTEND_URL đúng

### Lỗi MongoDB Connection
- Kiểm tra MongoDB Atlas IP whitelist
- Kiểm tra connection string
- Kiểm tra username/password

### Frontend không kết nối được Backend
- Kiểm tra REACT_APP_API_URL
- Kiểm tra network tab trong DevTools
- Đảm bảo backend đang chạy

---

## Chi Phí Ước Tính (Miễn Phí)

- **MongoDB Atlas**: FREE (512MB storage)
- **Render Backend**: FREE (có thể sleep sau 15 phút không dùng)
- **Vercel Frontend**: FREE (unlimited)
- **Tổng**: $0/tháng

Nếu cần không sleep, có thể upgrade:
- Render: $7/tháng
- Hoặc dùng Railway: $5/tháng

---

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Server logs trong hosting dashboard
2. Browser console (F12)
3. Network tab để xem API calls

