# Hướng Dẫn Tạo Admin Account

## Cách 1: Sử dụng Script (Đơn giản nhất) ⭐

1. Mở terminal/PowerShell trong thư mục `server`
2. Chạy lệnh:
```bash
node scripts/make-admin.js <username_của_bạn>
```

Ví dụ:
```bash
node scripts/make-admin.js admin
node scripts/make-admin.js myusername
```

## Cách 2: Sử dụng MongoDB Shell (mongosh)

1. Mở MongoDB Shell:
```bash
mongosh
```

2. Chọn database:
```javascript
use roblox-shop
```

3. Cập nhật role:
```javascript
db.users.updateOne(
  { username: "username_của_bạn" },
  { $set: { role: "admin" } }
)
```

4. Kiểm tra kết quả:
```javascript
db.users.findOne({ username: "username_của_bạn" })
```

## Cách 3: Sử dụng MongoDB Compass (GUI)

1. Mở MongoDB Compass
2. Kết nối đến MongoDB của bạn
3. Chọn database `roblox-shop`
4. Chọn collection `users`
5. Tìm user theo username
6. Click vào document
7. Tìm field `role` và đổi từ `"user"` thành `"admin"`
8. Click "Update"

## Sau khi cập nhật

1. Đăng xuất khỏi ứng dụng (nếu đang đăng nhập)
2. Đăng nhập lại
3. Bạn sẽ thấy nút "Admin" trong Navbar
4. Click vào "Admin" để vào trang quản trị

## Lưu ý

- Đảm bảo MongoDB đang chạy trước khi chạy script
- Đảm bảo file `.env` có cấu hình đúng `MONGODB_URI`
- Nếu dùng MongoDB Atlas, đảm bảo connection string đúng

