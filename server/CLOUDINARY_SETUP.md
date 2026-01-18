# Cloudinary Setup Guide

Hệ thống đã được tích hợp Cloudinary để lưu trữ ảnh bill thay vì lưu base64 trong MongoDB, giúp tiết kiệm ~95% dung lượng database.

## Bước 1: Đăng ký Cloudinary

1. Truy cập https://cloudinary.com/
2. Đăng ký tài khoản miễn phí (free tier có 25GB storage + 25GB bandwidth/tháng)
3. Sau khi đăng nhập, vào **Dashboard**

## Bước 2: Lấy Cloudinary Credentials

Trong Dashboard của Cloudinary, bạn sẽ thấy:
- **Cloud Name**
- **API Key**
- **API Secret**

## Bước 3: Thêm vào Environment Variables

Thêm các biến môi trường sau vào file `.env` (server folder):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Ví dụ:**
```env
CLOUDINARY_CLOUD_NAME=demo_cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Bước 4: Deploy trên Render.com

Nếu deploy trên Render.com, thêm các biến môi trường trong **Environment** tab:

1. Vào Settings → Environment
2. Thêm 3 biến:
   - `CLOUDINARY_CLOUD_NAME` = your_cloud_name
   - `CLOUDINARY_API_KEY` = your_api_key
   - `CLOUDINARY_API_SECRET` = your_api_secret

## Bước 5: Kiểm tra hoạt động

1. Khởi động server: `npm start`
2. Thử upload ảnh khi nạp tiền
3. Kiểm tra trong Cloudinary Dashboard → **Media Library** sẽ thấy ảnh đã upload

## Lợi ích

✅ **Tiết kiệm dung lượng MongoDB**: Thay vì lưu ~5MB base64 mỗi ảnh, chỉ lưu ~100 bytes URL  
✅ **Tối ưu hiệu năng**: Cloudinary tự động optimize ảnh (compression, format conversion)  
✅ **CDN**: Ảnh được serve qua CDN toàn cầu, tải nhanh hơn  
✅ **Quản lý dễ dàng**: Xem, xóa ảnh trực tiếp trong Cloudinary Dashboard  

## Lưu ý

- Free tier có giới hạn 25GB storage và 25GB bandwidth/tháng (thường đủ dùng)
- Ảnh cũ vẫn là base64 trong DB, có thể migrate sau nếu cần
- Ảnh mới sẽ tự động upload lên Cloudinary

## Xóa ảnh cũ (Tùy chọn)

Nếu muốn xóa ảnh base64 cũ trong MongoDB sau khi đã migrate:

```javascript
// Script cleanup (tùy chọn - chạy sau khi test kỹ)
// Đảm bảo backup database trước!
```
