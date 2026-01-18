# 🚀 Hướng Dẫn Deploy lên Render.com

## ⚠️ QUAN TRỌNG: Setup cho Render.com

Sau khi push code lên GitHub, bạn cần cấu hình trên Render.com:

### 1. Environment Variables (Biến Môi Trường)

Vào **Render Dashboard → Service → Environment** và thêm các biến sau:

#### Bắt buộc:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-very-secure-secret-key-here
```

#### Email (Nếu dùng):
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend URL (Nếu cần):
```
FRONTEND_URL=https://your-render-app.onrender.com
```

### 2. Build Command

Trong **Render Dashboard → Service → Settings → Build Command**:

```bash
cd client && npm install && npm run build && cd .. && npm install
```

### 3. Start Command

Trong **Render Dashboard → Service → Settings → Start Command**:

```bash
npm start
```

### 4. Root Directory

Để trống (mặc định) hoặc đặt là: `.`

### 5. Cài Đặt MongoDB Atlas (Nếu chưa có)

1. Tạo cluster miễn phí tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo database user
3. Whitelist IP: `0.0.0.0/0` (cho phép tất cả IP) hoặc Render IP
4. Copy connection string → dán vào `MONGODB_URI`

### 6. Cấu Hình Render Service

- **Auto-Deploy**: `Yes` (tự động deploy khi push code)
- **Branch**: `main` (hoặc branch bạn muốn deploy)
- **Health Check Path**: `/health`

### 7. Kiểm Tra Deploy

Sau khi deploy thành công:
1. Truy cập: `https://your-app.onrender.com`
2. Kiểm tra: `https://your-app.onrender.com/health`
3. DevTools → Sources: Chỉ thấy `main.xxxxx.js` (obfuscate), không thấy `Admin.js`

### 8. Lưu Ý

- ⚠️ Render.com sẽ tự động build production khi deploy
- ✅ Production build sẽ được serve tự động (không cần `npm start` dev server)
- ✅ Source code sẽ được obfuscate tự động
- ✅ YouTube iframe sẽ hoạt động (đã cấu hình CSP)

### 9. Troubleshooting

**Build fail:**
- Kiểm tra `package.json` có script `build` không
- Kiểm tra dependencies có đầy đủ không
- Xem logs trong Render Dashboard

**App không chạy:**
- Kiểm tra `MONGODB_URI` đúng chưa
- Kiểm tra `PORT` có đúng không
- Kiểm tra logs trong Render Dashboard

**YouTube video không hiện:**
- Đã cấu hình CSP với `frameSrc` cho YouTube
- Nếu vẫn lỗi, kiểm tra URL video đúng format chưa

---

## ✅ Checklist Trước Khi Deploy

- [ ] Đã push code lên GitHub
- [ ] Đã cấu hình Environment Variables trên Render
- [ ] Đã setup MongoDB Atlas
- [ ] Đã cấu hình Build Command
- [ ] Đã cấu hình Start Command
- [ ] Đã test build local: `cd client && npm run build`
