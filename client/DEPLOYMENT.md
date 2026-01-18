# Hướng Dẫn Deploy Production - Ẩn Source Code

## ⚠️ QUAN TRỌNG: Dev Server vs Production Build

### ❌ KHÔNG BAO GIỜ dùng `npm start` trong production!
Khi chạy `npm start` (development server), code source sẽ được serve trực tiếp, DevTools sẽ thấy file `Admin.js`, `Admin.css` gốc!

### ✅ Cách đúng để deploy:

1. **Build production:**
   ```bash
   cd client
   npm run build
   ```

2. **Serve production build** (chọn 1 trong các cách):

   **Cách 1: Dùng `serve` (khuyến nghị)**
   ```bash
   npm install -g serve
   serve -s build -p 3000
   ```

   **Cách 2: Dùng Node.js Express**
   ```javascript
   // server.js (root)
   const express = require('express');
   const path = require('path');
   const app = express();
   
   // Serve static files from React build
   app.use(express.static(path.join(__dirname, 'client/build')));
   
   // Catch all handler: send back React's index.html file
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'client/build/index.html'));
   });
   
   const PORT = process.env.PORT || 3000;
   app.listen(PORT);
   ```

   **Cách 3: Dùng nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/client/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 🔒 Bảo Mật Đã Được Áp Dụng

✅ **Obfuscation:** Code JavaScript đã được obfuscate (khó đọc)  
✅ **No Source Maps:** Source maps đã bị tắt hoàn toàn  
✅ **Minification:** Code đã được minify  
✅ **Bundling:** Tất cả code được bundle thành 1 file  

## 📝 Kiểm Tra

Sau khi deploy production build:
1. Mở DevTools → Sources
2. Bạn CHỈ nên thấy file `main.xxxxx.js` (đã obfuscate)
3. KHÔNG nên thấy folder `src/` hoặc file `Admin.js`, `Admin.css` gốc

## ⚠️ Lưu Ý

- Development (`npm start`): Luôn hiển thị source code gốc - **ĐÂY LÀ BÌNH THƯỜNG**
- Production (`npm run build` + serve static): Chỉ hiển thị code obfuscate - **ĐÂY MỚI LÀ MỤC TIÊU**
