const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const isEmailConfigured = () => {
    return (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS &&
        process.env.EMAIL_USER !== 'your-email@gmail.com' &&
        process.env.EMAIL_PASS !== 'your-app-password'
    );
};

const createTransporter = () => {
    if (!isEmailConfigured()) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
};

const buildOrderHtml = (order, user) => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${item.quantity}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:right;">${formatCurrency(item.price)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hóa đơn đơn hàng</h2>
            <p>Xin chào ${user.name || ''},</p>
            <p>Đơn hàng của bạn đã được ghi nhận thành công. Dưới đây là thông tin chi tiết đơn hàng:</p>
            <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
            <p><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus}</p>
            <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod}</p>
            <p><strong>Địa chỉ nhận hàng:</strong> ${order.shippingAddress}</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
                <thead>
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Sản phẩm</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align:center;">SL</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Giá</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div style="margin-top: 16px;">
                <p><strong>Tổng tiền hàng:</strong> ${formatCurrency(order.totalPrice)}</p>
                <p><strong>Giảm giá:</strong> ${formatCurrency(order.discount || 0)}</p>
                <p><strong>Phí vận chuyển:</strong> ${formatCurrency(order.shippingFee || 0)}</p>
                <p><strong>Thuế:</strong> ${formatCurrency(order.tax || 0)}</p>
                <p style="font-size: 16px; font-weight: 700;"><strong>Thanh toán cuối cùng:</strong> ${formatCurrency(order.finalPrice)}</p>
            </div>
            <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi.</p>
        </div>
    `;
};

const generateInvoicePDF = (order, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('HÓA ĐƠN THANH TOÁN', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Mã đơn hàng: ${order._id}`);
        doc.text(`Khách hàng: ${user.name || ''}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Trạng thái thanh toán: ${order.paymentStatus}`);
        doc.text(`Phương thức thanh toán: ${order.paymentMethod}`);
        doc.moveDown();
        doc.text(`Địa chỉ nhận hàng: ${order.shippingAddress}`);
        doc.moveDown();

        const tableTop = doc.y;
        const itemTableHeaders = ['Sản phẩm', 'SL', 'Giá', 'Thành tiền'];
        const columnPositions = [50, 320, 380, 460];

        doc.font('Helvetica-Bold');
        itemTableHeaders.forEach((header, index) => {
            doc.text(header, columnPositions[index], tableTop, { width: index === 0 ? 240 : 80, align: index === 0 ? 'left' : 'right' });
        });
        doc.moveDown();
        doc.font('Helvetica');

        order.items.forEach(item => {
            const y = doc.y;
            doc.text(item.name, columnPositions[0], y, { width: 240, align: 'left' });
            doc.text(item.quantity.toString(), columnPositions[1], y, { width: 80, align: 'right' });
            doc.text(formatCurrency(item.price), columnPositions[2], y, { width: 80, align: 'right' });
            doc.text(formatCurrency(item.price * item.quantity), columnPositions[3], y, { width: 80, align: 'right' });
            doc.moveDown();
        });

        doc.moveDown();
        doc.text(`Tổng tiền hàng: ${formatCurrency(order.totalPrice)}`);
        doc.text(`Giảm giá: ${formatCurrency(order.discount || 0)}`);
        doc.text(`Phí vận chuyển: ${formatCurrency(order.shippingFee || 0)}`);
        doc.text(`Thuế: ${formatCurrency(order.tax || 0)}`);
        doc.moveDown();
        doc.font('Helvetica-Bold').text(`Tổng thanh toán: ${formatCurrency(order.finalPrice)}`);

        doc.end();
    });
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    const transporter = createTransporter();
    if (!transporter) {
        throw new Error('Email configuration is missing or invalid. Set EMAIL_USER and EMAIL_PASS in .env.');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        attachments
    };

    return transporter.sendMail(mailOptions);
};

const sendOrderConfirmation = async (order, user) => {
    if (!user || !user.email) {
        throw new Error('Unable to send order confirmation because the user email is missing');
    }

    const html = buildOrderHtml(order, user);
    const invoiceBuffer = await generateInvoicePDF(order, user);

    await sendEmail({
        to: user.email,
        subject: `Xác nhận đơn hàng ${order._id}`,
        html,
        attachments: [
            {
                filename: `invoice-${order._id}.pdf`,
                content: invoiceBuffer
            }
        ]
    });
};

module.exports = {
    sendOrderConfirmation,
    generateInvoicePDF
};
