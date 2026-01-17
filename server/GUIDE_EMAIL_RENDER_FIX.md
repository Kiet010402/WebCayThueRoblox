# Hướng Dẫn Sửa Lỗi Email Trên Render.com

## Vấn Đề
Khi deploy lên Render.com, tính năng quên mật khẩu bị lỗi "Connection timeout" khi gửi email qua Gmail SMTP.

## Giải Pháp Đã Áp Dụng

### 1. Cấu Hình SMTP Đầy Đủ
Đã cập nhật cấu hình nodemailer với:
- Host và port cụ thể cho Gmail (`smtp.gmail.com:587`)
- Timeout settings (60 giây)
- Connection pooling
- TLS configuration

### 2. Retry Logic
Thêm cơ chế retry tự động (3 lần thử) với exponential backoff.

## Nếu Vẫn Không Hoạt Động

### Giải Pháp 1: Kiểm Tra Environment Variables trên Render.com

1. Vào Render.com Dashboard → Web Service của bạn
2. Vào tab **Environment**
3. Đảm bảo có các biến sau:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=dkiet9337@gmail.com
   EMAIL_PASSWORD=auwm bilk ctnq mfqf
   ```
4. **QUAN TRỌNG**: Kiểm tra xem `EMAIL_PASSWORD` có đúng App Password không (không phải mật khẩu thường)

### Giải Pháp 2: Sử Dụng OAuth2 (Khuyến Nghị Cho Production)

Nếu App Password vẫn không hoạt động, có thể dùng OAuth2:

1. Tạo OAuth2 credentials tại: https://console.cloud.google.com/
2. Cập nhật code để sử dụng OAuth2 thay vì App Password

### Giải Pháp 3: Sử Dụng Email Service Khác

#### Option A: SendGrid (Miễn phí 100 emails/ngày)
1. Đăng ký tại: https://sendgrid.com/
2. Tạo API Key
3. Cập nhật `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your_api_key_here
   ```
4. Cập nhật code trong `server/routes/users.js` để dùng SendGrid SMTP:
   ```javascript
   transporter = nodemailer.createTransport({
     host: 'smtp.sendgrid.net',
     port: 587,
     auth: {
       user: 'apikey',
       pass: process.env.EMAIL_PASSWORD // SendGrid API Key
     }
   });
   ```

#### Option B: Resend (Miễn phí 3,000 emails/tháng)
1. Đăng ký tại: https://resend.com/
2. Tạo API Key
3. Cập nhật code để dùng Resend API

#### Option C: Mailgun (Miễn phí 5,000 emails/tháng)
1. Đăng ký tại: https://www.mailgun.com/
2. Cấu hình tương tự SendGrid

### Giải Pháp 4: Kiểm Tra Firewall/Network

Render.com có thể block một số port. Thử:
- Port 587 (TLS) - Đã cấu hình
- Port 465 (SSL) - Có thể thử nếu 587 không hoạt động

Cập nhật code để thử port 465:
```javascript
port: 465,
secure: true, // true for 465, false for other ports
```

## Debug

Để debug, kiểm tra logs trên Render.com:
1. Vào Web Service → Logs
2. Tìm các dòng log bắt đầu bằng "Email sending error"
3. Kiểm tra error code và message

## Test Local

Để test trên local trước khi deploy:
```bash
# Đảm bảo .env có đúng cấu hình
EMAIL_SERVICE=gmail
EMAIL_USER=dkiet9337@gmail.com
EMAIL_PASSWORD=auwm bilk ctnq mfqf

# Chạy server
cd server
npm start

# Test quên mật khẩu
# Vào http://localhost:3000/login → Quên mật khẩu
```

## Lưu Ý

- App Password của Gmail chỉ hoạt động khi đã bật 2-Step Verification
- Một số cloud platform có thể block SMTP connections
- Nên dùng email service chuyên dụng (SendGrid, Resend) cho production
