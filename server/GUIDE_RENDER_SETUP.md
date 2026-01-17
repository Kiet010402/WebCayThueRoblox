# Hướng Dẫn Setup OAuth2 Email Trên Render.com

## Bước 1: Cập Nhật Environment Variables Trên Render.com

1. Vào **Render.com Dashboard** → Chọn **Web Service** của bạn
2. Vào tab **Environment**
3. **Thêm/Xóa** các biến sau:

### ✅ Thêm các biến mới:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

### ❌ Xóa biến cũ (nếu có):

```
EMAIL_PASSWORD
```

**Lưu ý:** 
- `GMAIL_REFRESH_TOKEN` phải là token mới nhất từ `token.json` (sau khi chạy `get-oauth2-token.js`)
- Không có khoảng trắng thừa ở đầu/cuối các giá trị

---

## Bước 2: Deploy Lại Service

1. Sau khi cập nhật Environment Variables, Render.com sẽ tự động **redeploy**
2. Hoặc click **"Manual Deploy"** → **"Deploy latest commit"**
3. Đợi deploy hoàn tất (thường 2-5 phút)

---

## Bước 3: Kiểm Tra Logs

1. Vào tab **Logs** trên Render.com
2. Tìm các dòng log sau khi deploy:

### ✅ Thành công:
```
OAuth2 email configuration detected - transporter will be created on demand
Server running on port 5000
MongoDB connected
```

### ❌ Nếu có lỗi:
- **"OAuth2 credentials are missing"** → Kiểm tra lại Environment Variables
- **"invalid_grant"** → Refresh token đã hết hạn, cần lấy lại
- **"BadCredentials"** → Client ID/Secret hoặc Refresh Token sai

---

## Bước 4: Test Tính Năng Quên Mật Khẩu

1. Vào website đã deploy
2. Click **"Quên mật khẩu?"**
3. Nhập email đã đăng ký
4. Kiểm tra email (kể cả thư mục Spam)
5. Nếu nhận được email → ✅ **Thành công!**

---

## Troubleshooting

### Lỗi: "Invalid grant" hoặc "invalid_grant"

**Nguyên nhân:** Refresh token đã hết hạn hoặc bị revoke

**Giải pháp:**
1. Chạy lại script trên local:
   ```bash
   cd server
   node scripts/get-oauth2-token.js
   ```
2. Copy refresh token mới từ output
3. Cập nhật `GMAIL_REFRESH_TOKEN` trên Render.com

---

### Lỗi: "Access blocked" hoặc "Access denied"

**Nguyên nhân:** OAuth consent screen chưa được cấu hình đúng

**Giải pháp:**
1. Vào Google Cloud Console: https://console.cloud.google.com/
2. Vào **APIs & Services** → **OAuth consent screen**
3. Đảm bảo:
   - App đã được publish (hoặc email của bạn trong Test users)
   - Scope `https://www.googleapis.com/auth/gmail.send` đã được thêm
   - Email của bạn trong **Test users**

---

### Lỗi: "BadCredentials"

**Nguyên nhân:** Client ID, Client Secret hoặc Refresh Token sai

**Giải pháp:**
1. Kiểm tra lại `credentials.json` trên local
2. Đảm bảo các giá trị trong Environment Variables đúng:
   - `GMAIL_CLIENT_ID` = `client_id` từ `credentials.json`
   - `GMAIL_CLIENT_SECRET` = `client_secret` từ `credentials.json`
   - `GMAIL_REFRESH_TOKEN` = refresh token mới nhất

---

### Email Không Đến

**Kiểm tra:**
1. Xem logs trên Render.com có lỗi gì không
2. Kiểm tra thư mục **Spam**
3. Kiểm tra email có đúng không
4. Thử lại sau vài phút (có thể bị delay)

---

## Lưu Ý Quan Trọng

1. **Refresh Token không hết hạn** (trừ khi bị revoke)
2. **Access Token tự động refresh** khi hết hạn
3. **Không cần App Password** nữa khi dùng OAuth2
4. **An toàn hơn** cho production

---

## Cấu Trúc Environment Variables Trên Render.com

```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
NODE_ENV=production
```

---

## Sau Khi Setup Xong

✅ Email sẽ hoạt động trên Render.com  
✅ Không còn lỗi "Connection timeout"  
✅ Tính năng quên mật khẩu hoạt động bình thường  

Nếu có vấn đề, kiểm tra logs trên Render.com và tham khảo phần Troubleshooting ở trên.
