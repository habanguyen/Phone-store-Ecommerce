const dashboardService = require("../services/dashboard.service");

const overview = async (req, res) => {
    const data = await dashboardService.getOverview();
    res.json(data);
};

const topProducts = async (req, res) => {
    const data = await dashboardService.getTopProducts();
    res.json(data);
};

const revenueSeries = async (req, res) => {
    const data = await dashboardService.getRevenueSeries(req.query);
    res.json(data);
};

const revenueSummary = async (req, res) => {
    const data = await dashboardService.getRevenueSummary(req.query);
    res.json(data);
};

const revenueReport = async (req, res) => {
    const data = await dashboardService.getRevenueReport(req.query);
    res.json(data);
};

const exportRevenue = async (req, res) => {
    const report = await dashboardService.getRevenueReport(req.query);
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Revenue');

    sheet.columns = [
        { header: 'Order ID', key: '_id', width: 30 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Tên', key: 'userName', width: 25 },
        { header: 'Tổng thanh toán', key: 'finalPrice', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Thanh toán', key: 'paymentStatus', width: 15 },
        { header: 'Phương thức', key: 'paymentMethod', width: 20 },
        { header: 'Hoàn tiền', key: 'refundStatus', width: 15 },
        { header: 'Số tiền hoàn', key: 'refundAmount', width: 15 },
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
        { header: 'Địa chỉ giao hàng', key: 'shippingAddress', width: 50 }
    ];

    report.forEach((row) => {
        sheet.addRow({
            _id: row._id,
            userEmail: row.userEmail,
            userName: row.userName,
            finalPrice: row.finalPrice,
            status: row.status,
            paymentStatus: row.paymentStatus,
            paymentMethod: row.paymentMethod,
            refundStatus: row.refundStatus,
            refundAmount: row.refundAmount,
            createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '',
            shippingAddress: typeof row.shippingAddress === 'string' ? row.shippingAddress : JSON.stringify(row.shippingAddress || '')
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
};

module.exports = {
    overview,
    topProducts,
    revenueSeries,
    revenueSummary,
    revenueReport,
    exportRevenue
};