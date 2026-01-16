# Hướng Dẫn Cấu Hình Email Gmail

## BƯỚC 1: BẬT 2-STEP VERIFICATION (XÁC MINH 2 BƯỚC)

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"Xác minh 2 bước"** hoặc **"2-Step Verification"**
3. Click vào và bật tính năng này
4. Làm theo hướng dẫn (có thể yêu cầu số điện thoại)

**QUAN TRỌNG:** Phải bật 2-Step Verification thì mới có thể tạo App Password!

---

## BƯỚC 2: TẠO APP PASSWORD

### Sau khi đã bật 2-Step Verification:

1. Truy cập: https://myaccount.google.com/apppasswords
   - Hoặc vào: https://myaccount.google.com/security
   - Chọn **"Mật khẩu ứng dụng"** hoặc **"App passwords"**

2. Nếu bạn thấy nút **"Tạo mật khẩu ứng dụng"** (màu xanh):
   - Click vào nút đó
   - Chọn ứng dụng: **"Mail"** hoặc **"Other"**
   - Đặt tên: **"WebCayThueRoblox"** hoặc tên bất kỳ
   - Click **"Generate"** hoặc **"Tạo"**

3. Google sẽ hiển thị mã 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
   - **COPY MÃ NÀY NGAY** (bạn chỉ thấy 1 lần!)
   - Nếu bạn thấy mã dạng: `abcd efgh ijkl mnop` → dùng luôn hoặc bỏ dấu cách thành `abcdefghijklmnop`

---

## BƯỚC 3: CẬP NHẬT FILE .env

Mở file `server/.env` và sửa:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=dkiet9337@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Lưu ý:**
- `EMAIL_USER`: Email Gmail của bạn (ví dụ: dkiet9337@gmail.com)
- `EMAIL_PASSWORD`: Mã 16 ký tự vừa copy (có thể có dấu cách hoặc không)

---

## BƯỚC 4: KHỞI ĐỘNG LẠI SERVER

```bash
# Dừng server (Ctrl+C nếu đang chạy)
# Sau đó chạy lại:
cd server
npm start
```

---

## KIỂM TRA

1. Vào trang web → Quên mật khẩu
2. Nhập email đã đăng ký
3. Click "GỬI MÃ XÁC NHẬN"
4. Kiểm tra email của bạn (kể cả thư mục Spam)

---

## NẾU KHÔNG THẤY NÚT "TẠO MẬT KHẨU ỨNG DỤNG"

**Nguyên nhân:** Chưa bật 2-Step Verification

**Cách khắc phục:**
1. Vào: https://myaccount.google.com/security
2. Tìm **"Xác minh 2 bước"** → Click **"Bắt đầu"**
3. Làm theo hướng dẫn (nhập số điện thoại, xác minh)
4. Sau khi bật xong, quay lại trang App Passwords
5. Lúc này sẽ thấy nút "Tạo mật khẩu ứng dụng"

---

## NẾU ĐÃ CÓ APP PASSWORD RỒI

Nếu bạn đã từng tạo App Password tên "WebCayThueRoblox":
- Bạn không thể xem lại mã cũ
- Phải tạo App Password mới
- Hoặc click "Thu hồi" (Revoke) rồi tạo lại

