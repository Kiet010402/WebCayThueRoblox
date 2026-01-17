# Hướng Dẫn Cấu Hình OAuth2 Cho Gmail

## Tại Sao Dùng OAuth2?

- **An toàn hơn**: Không cần App Password
- **Hoạt động tốt trên cloud**: Không bị block bởi firewall
- **Phù hợp production**: Được Google khuyến nghị

---

## BƯỚC 1: Tạo OAuth2 Credentials Trên Google Cloud Console

### 1.1. Tạo Project Mới (Nếu Chưa Có)

1. Truy cập: https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Đặt tên project: `WebCayThueRoblox` (hoặc tên khác)
4. Click **"Create"**

### 1.2. Bật Gmail API

1. Vào **"APIs & Services"** → **"Library"**
2. Tìm **"Gmail API"**
3. Click vào và chọn **"Enable"**

### 1.3. Tạo OAuth2 Credentials

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Nếu chưa có OAuth consent screen:
   - Click **"Configure Consent Screen"**
   - Chọn **"External"** → **"Create"**
   - Điền thông tin:
     - **App name**: `WebCayThueRoblox`
     - **User support email**: Email của bạn
     - **Developer contact**: Email của bạn
   - Click **"Save and Continue"**
   - Ở **Scopes**: Click **"Add or Remove Scopes"**
     - Tìm và chọn: `https://www.googleapis.com/auth/gmail.send`
   - Click **"Save and Continue"**
   - Ở **Test users**: Thêm email của bạn
   - Click **"Save and Continue"** → **"Back to Dashboard"**

4. Quay lại **"Credentials"** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Chọn **"Web application"**
6. Đặt tên: `Gmail OAuth2 Client`
7. **Authorized redirect URIs**: Thêm:
   ```
   http://localhost:3000
   http://localhost:5000
   ```
8. Click **"Create"**
9. **QUAN TRỌNG**: Download file JSON (sẽ có dạng `client_secret_xxxxx.json`)
10. Đổi tên file thành `credentials.json` và đặt vào thư mục `server/`

---

## BƯỚC 2: Cài Đặt Dependencies

```bash
cd server
npm install googleapis
```

---

## BƯỚC 3: Lấy Refresh Token

1. Chạy script:
   ```bash
   node scripts/get-oauth2-token.js
   ```

2. Script sẽ hiển thị URL, mở URL đó trong trình duyệt

3. Chọn tài khoản Google của bạn

4. Click **"Advanced"** → **"Go to WebCayThueRoblox (unsafe)"** (nếu có cảnh báo)

5. Click **"Allow"**

6. Copy **code** từ URL (sau `?code=`) và paste vào terminal

7. Script sẽ hiển thị **Refresh Token**, copy nó

---

## BƯỚC 4: Cập Nhật Environment Variables

### Trên Local (.env):

```env
EMAIL_SERVICE=gmail
EMAIL_USER=dkiet9337@gmail.com
EMAIL_PASSWORD=  # Không cần nữa
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

**Lấy Client ID và Client Secret từ file `credentials.json`:**

```json
{
  "installed": {
    "client_id": "xxxxx.apps.googleusercontent.com",
    "client_secret": "xxxxx",
    ...
  }
}
```

Hoặc nếu là web app:

```json
{
  "web": {
    "client_id": "xxxxx.apps.googleusercontent.com",
    "client_secret": "xxxxx",
    ...
  }
}
```

### Trên Render.com:

1. Vào **Web Service** → **Environment**
2. Thêm các biến:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=dkiet9337@gmail.com
   GMAIL_CLIENT_ID=your_client_id_here
   GMAIL_CLIENT_SECRET=your_client_secret_here
   GMAIL_REFRESH_TOKEN=your_refresh_token_here
   ```
3. **Xóa** biến `EMAIL_PASSWORD` (không cần nữa)

---

## BƯỚC 5: Test

1. Khởi động lại server
2. Test tính năng quên mật khẩu
3. Kiểm tra email

---

## Lưu Ý

- **Refresh Token không bao giờ hết hạn** (trừ khi bạn revoke)
- **Access Token tự động refresh** khi hết hạn
- **Không cần App Password** nữa
- **An toàn hơn** cho production

---

## Troubleshooting

### Lỗi: "Invalid grant"
- Refresh token đã bị revoke
- Chạy lại script `get-oauth2-token.js` để lấy token mới

### Lỗi: "Access blocked"
- Kiểm tra OAuth consent screen đã publish chưa
- Hoặc thêm email vào Test users

### Lỗi: "Redirect URI mismatch"
- Kiểm tra redirect URI trong credentials.json khớp với script

---

## File Cần Có

```
server/
├── credentials.json          # Download từ Google Cloud Console
├── token.json               # Tự động tạo khi chạy script
├── .env                     # Chứa GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
└── scripts/
    └── get-oauth2-token.js  # Script lấy refresh token
```

---

## Security

⚠️ **QUAN TRỌNG**: 
- **KHÔNG commit** `credentials.json` và `token.json` lên Git
- Thêm vào `.gitignore`:
  ```
  credentials.json
  token.json
  ```
