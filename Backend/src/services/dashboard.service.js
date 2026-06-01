const Order = require("../models/order.model");

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const buildDateRange = ({ day, month, year, from, to }) => {
  const result = {};
  const parsedDay = parseNumber(day);
  const parsedMonth = parseNumber(month);
  const parsedYear = parseNumber(year);

  if (parsedDay && parsedMonth && parsedYear) {
    result.start = new Date(parsedYear, parsedMonth - 1, parsedDay, 0, 0, 0, 0);
    result.end = new Date(parsedYear, parsedMonth - 1, parsedDay, 23, 59, 59, 999);
  } else if (parsedMonth && parsedYear) {
    result.start = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
    result.end = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
  } else if (parsedYear) {
    result.start = new Date(parsedYear, 0, 1, 0, 0, 0, 0);
    result.end = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
  } else {
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        result.start = new Date(fromDate.setHours(0, 0, 0, 0));
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        result.end = new Date(toDate.setHours(23, 59, 59, 999));
      }
    }
  }

  return result;
};

const buildMatchDate = (query) => {
  const filter = { paymentStatus: "paid" };
  const { start, end } = buildDateRange(query);
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = start;
    if (end) filter.createdAt.$lte = end;
  }
  return filter;
};

const buildTimeLabel = (groupBy, item) => {
  if (groupBy === "year") {
    return `${item._id.year}`;
  }
  const month = String(item._id.month).padStart(2, "0");
  if (groupBy === "month") {
    return `${item._id.year}-${month}`;
  }
  const day = String(item._id.day).padStart(2, "0");
  return `${item._id.year}-${month}-${day}`;
};

const fillSeries = (series, query, groupBy) => {
  const { month, year } = query;
  if (groupBy === "month" && year) {
    const parsedYear = parseNumber(year);
    return Array.from({ length: 12 }, (_, i) => {
      const label = `${parsedYear}-${String(i + 1).padStart(2, "0")}`;
      const row = series.find((item) => item.label === label);
      return {
        label,
        revenue: row ? row.revenue : 0,
        orders: row ? row.orders : 0
      };
    });
  }
  if (groupBy === "day" && year && month) {
    const parsedYear = parseNumber(year);
    const parsedMonth = parseNumber(month);
    const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const label = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      const row = series.find((item) => item.label === label);
      return {
        label,
        revenue: row ? row.revenue : 0,
        orders: row ? row.orders : 0
      };
    });
  }
  return series;
};

const formatSeries = (items, groupBy, query) => {
  const series = items.map((item) => ({
    label: buildTimeLabel(groupBy, item),
    revenue: item.revenue || 0,
    orders: item.orders || 0
  }));

  const filled = fillSeries(series, query, groupBy);

  return filled.map((item, index, arr) => {
    const previousRevenue = index > 0 ? arr[index - 1].revenue : 0;
    const change = item.revenue - previousRevenue;
    const growth = previousRevenue ? Math.round((change / previousRevenue) * 100) : null;
    return {
      ...item,
      change,
      growth
    };
  });
};

// OVERVIEW
const getOverview = async () => {
    const orders = await Order.find();

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, order) => {
        if (order.paymentStatus === "paid") {
            const price = Number(order.finalPrice) || 0;
            return sum + price;
        }
        return sum;
    }, 0);

    const statusCount = {
        pending: 0,
        confirmed: 0,
        shipping: 0,
        delivered: 0,
        cancelled: 0
    };

    orders.forEach(order => {
        statusCount[order.status]++;
    });

    return {
        totalOrders,
        totalRevenue,
        statusCount
    };
};

// 🔥 TOP PRODUCTS
const getTopProducts = async () => {
    const result = await Order.aggregate([
        { $match: { paymentStatus: "paid" } },

        { $unwind: "$items" },

        {
            $group: {
                _id: "$items.product",
                name: { $first: "$items.name" },
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }
        },

        { $sort: { totalSold: -1 } },

        { $limit: 10 }
    ]);

    return result;
};

const getRevenueSeries = async (query) => {
    const groupBy = query.groupBy || 'month';
    const match = buildMatchDate(query);
    const project = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
    };

    let groupId = { year: '$year', month: '$month' };
    let sort = { '_id.year': 1, '_id.month': 1 };

    if (groupBy === 'day') {
        groupId = { year: '$year', month: '$month', day: '$day' };
        sort = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
    } else if (groupBy === 'year') {
        groupId = { year: '$year' };
        sort = { '_id.year': 1 };
    }

    const data = await Order.aggregate([
        { $match: match },
        { $project: project },
        {
            $group: {
                _id: groupId,
                revenue: { $sum: '$finalPrice' },
                orders: { $sum: 1 }
            }
        },
        { $sort: sort }
    ]);

    return formatSeries(data, groupBy, query);
};

const getRevenueReport = async (query) => {
    const match = buildMatchDate(query);
    const orders = await Order.find(match).populate('user');
    return orders.map((order) => ({
        _id: order._id,
        userEmail: order.user?.email || '',
        userName: order.user?.name || '',
        finalPrice: order.finalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress
    }));
};

const getRevenueSummary = async (query) => {
    const series = await getRevenueSeries(query);
    const totalRevenue = series.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = series.reduce((sum, item) => sum + item.orders, 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        series
    };
};

module.exports = {
    getOverview,
    getTopProducts,
    getRevenueSeries,
    getRevenueReport,
    getRevenueSummary
};