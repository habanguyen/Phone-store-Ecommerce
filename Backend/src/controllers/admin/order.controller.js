const orderService = require("../../services/order.service");
const RefundLog = require("../../models/refund.model");
const ExcelJS = require("exceljs");
const emailService = require("../../services/email.service");

// LIST
const getOrdersAdmin = async (req, res) => {
    const data = await orderService.getOrdersAdmin(req.query);
    res.json(data);
};

// DETAIL
const getOrderDetail = async (req, res) => {
    const order = await orderService.getOrderDetail(req.params.id);
    res.json(order);
};

// UPDATE STATUS
const updateOrderStatus = async (req, res) => {
    const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status
    );
    res.json(order);
};

// UPDATE REFUND STATUS
const updateRefundStatus = async (req, res) => {
    try {
        const order = await orderService.updateRefundStatus(
            req.params.id,
            req.body.refundStatus
        );
        // create admin-linked refund log
        try {
            await RefundLog.create({
                order: req.params.id,
                admin: req.user?._id,
                action: req.body.refundStatus,
                amount: order.refundAmount || 0,
                note: req.body.note || ''
            });
        } catch (err) {
            console.error('Failed to create refund log (controller):', err.message || err);
        }

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// EXPORT EXCEL
const exportOrders = async (req, res) => {
    const orders = await orderService.getOrdersAdmin(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");

    sheet.columns = [
        { header: "ID", key: "_id", width: 25 },
        { header: "Name", key: "name", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Total (VND)", key: "total", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Payment Status", key: "paymentStatus", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 15 },
        { header: "Refund Status", key: "refundStatus", width: 15 },
        { header: "Refund Amount", key: "refundAmount", width: 15 },
        { header: "Date", key: "date", width: 12 },
        { header: "Month", key: "month", width: 10 },
        { header: "Year", key: "year", width: 8 },
        { header: "Checkout Time", key: "time", width: 12 },
        { header: "Shipping Address", key: "shippingAddress", width: 50 }
    ];

    orders.forEach(o => {
        const created = new Date(o.createdAt);
        const day = String(created.getDate()).padStart(2, '0');
        const month = String(created.getMonth() + 1).padStart(2, '0');
        const year = created.getFullYear();
        const time = created.toTimeString().split(' ')[0];

        sheet.addRow({
            _id: o._id,
            name: o.user?.name || '',
            email: o.user?.email || '',
            total: o.finalPrice,
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            refundStatus: o.refundStatus || 'none',
            refundAmount: o.refundAmount || 0,
            date: day,
            month,
            year,
            time,
            shippingAddress: o.shippingAddress || ''
        });
    });

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=orders.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
};

module.exports = {
    getOrdersAdmin,
    getOrderDetail,
    updateOrderStatus,
    updateRefundStatus,
    exportOrders,
    getRefundLogs: async (req, res) => {
        try {
            const logs = await orderService.getRefundLogs(req.params.id);
            res.json(logs);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },
    getInvoice: async (req, res) => {
        try {
            const order = await orderService.getOrderDetail(req.params.id);
            const user = order.user || (await require('../../models/user.model').findById(order.user));
            const pdfBuffer = await emailService.generateInvoicePDF(order, user);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
            res.send(pdfBuffer);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
};