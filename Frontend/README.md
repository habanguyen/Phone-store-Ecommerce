# Frontend 

## Chạy frontend

1. Cài dependencies:

```bash
npm install
```

2. Chạy dev server:

```bash
npm run dev
```

3. Mở trình duyệt đến `http://localhost:5173`

## Tính năng hiện có

- Trang tìm kiếm, hiển thị sản phẩm
- Trang chi tiết sản phẩm
- Đăng ký / đăng nhập
- Thêm vào giỏ hàng, cập nhật giỏ hàng
- Checkout và tạo đơn hàng
- Xem đơn hàng của người dùng
- Dashboard admin quản lý người dùng, đơn hàng, sản phẩm và báo cáo doanh thu

## Lưu ý

Frontend giả lập thanh toán online bằng tạo đơn hàng đơn giản. Nếu muốn tích hợp Stripe, cần mở rộng thêm phần checkout payment.
