const Product = require("../models/product.model");
const Chat = require("../models/chat.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const intentService = require("./intent.service");

const policyResponses = [
    {
        keys: ["bảo hành", "warranty", "chính sách bảo hành"],
        answer: `Chính sách bảo hành của chúng tôi:
- Bảo hành chính hãng 12 tháng cho điện thoại và 6 tháng cho phụ kiện.
- 1 đổi 1 trong 30 ngày nếu lỗi kỹ thuật từ nhà sản xuất.
- Hãy giữ lại hóa đơn hoặc mã đơn hàng để hỗ trợ nhanh hơn.
Nếu bạn cần tư vấn chi tiết về sản phẩm hoặc mã đơn hàng, vui lòng cho tôi biết.`
    },
    {
        keys: ["đổi trả", "trả hàng", "chính sách bán hàng", "refund", "return", "đổi hàng"],
        answer: `Chính sách bán hàng:
- Đổi trả trong 7 ngày nếu sản phẩm bị lỗi kỹ thuật hoặc khác mô tả.
- Hỗ trợ đổi 1 lấy 1 trong 30 ngày khi sản phẩm lỗi từ nhà sản xuất.
- Vui lòng giữ nguyên vẹn hộp, tem và phiếu mua hàng.
- Hỗ trợ nhiều phương thức thanh toán và giao hàng an toàn.`
    },
    {
        keys: ["trả góp", "installment", "phương thức thanh toán", "thanh toán"],
        answer: `Chúng tôi hỗ trợ các phương thức thanh toán sau:
- Thanh toán trực tiếp khi nhận hàng.
- Chuyển khoản ngân hàng / thẻ nội địa.
- Thanh toán trả góp qua đối tác tài chính (nếu có).
Vui lòng cho biết bạn muốn trả góp bao nhiêu phần trăm để tôi hỗ trợ chi tiết.`
    }
];

const fallbackResponse = `Xin chào! Tôi có thể giúp bạn:
- Gợi ý sản phẩm phù hợp
- So sánh sản phẩm và tìm sản phẩm thông minh
- Trả lời thông tin sản phẩm, chính sách bán hàng và bảo hành
- Hỗ trợ chăm sóc khách hàng và theo dõi đơn hàng
Hãy cho tôi biết bạn đang tìm sản phẩm nào hoặc yêu cầu cụ thể.`;

const extractWords = (text) => text.match(/\p{L}+/gu)?.filter((word) => word.length > 1) || [];

const buildSearchFilter = (message) => {
    const lower = message.toLowerCase();
    const filter = { isDeleted: false };

    if (/(tablet|máy tính bảng)/i.test(lower)) {
        filter.category = "Tablet";
    } else if (/(phụ kiện|accessory)/i.test(lower)) {
        filter.category = "Accessory";
    } else if (/(sửa chữa|dịch vụ)/i.test(lower)) {
        filter.category = "Service";
    } else if (/(smartphone|điện thoại|iphone|samsung|xiaomi|oppo|vivo|realme|redmi|xiaomi)/i.test(lower)) {
        filter.category = "Smartphone";
    }

    const words = extractWords(message).slice(0, 6);
    if (words.length > 0) {
        const keywords = words.join("|");
        filter.$or = [
            { name: { $regex: keywords, $options: "i" } },
            { description: { $regex: keywords, $options: "i" } },
            { brand: { $regex: keywords, $options: "i" } },
            { category: { $regex: keywords, $options: "i" } }
        ];
    }

    return filter;
};

const formatProductList = (products) => {
    if (!products || products.length === 0) {
        return `Hiện tại tôi chưa tìm được sản phẩm phù hợp. Bạn có thể cho biết thêm tiêu chí như "pin lâu", "chụp hình đẹp", "giá dưới 10 triệu" hoặc tên hãng điện thoại.`;
    }

    return [`Dưới đây là một số sản phẩm gợi ý phù hợp với yêu cầu của bạn:`]
        .concat(
            products.map((product, index) => {
                const price = product.sale_price || product.base_price || 0;
                return `${index + 1}. ${product.name} (${product.category}) - ${price.toLocaleString()}₫. Xem chi tiết: /product/${product._id}`;
            })
        )
        .join("\n");
};

const searchProducts = async (query) => {
    const filter = { isDeleted: false };
    if (!query) {
        return await Product.find(filter).limit(6);
    }

    const words = extractWords(query).slice(0, 5);
    if (words.length > 0) {
        const keywords = words.join("|");
        filter.$or = [
            { name: { $regex: keywords, $options: "i" } },
            { description: { $regex: keywords, $options: "i" } },
            { brand: { $regex: keywords, $options: "i" } },
            { category: { $regex: keywords, $options: "i" } }
        ];
    }

    return await Product.find(filter).limit(6);
};

const findProductByName = async (text) => {
    if (!text) return null;
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return await Product.findOne({ isDeleted: false, $or: [{ name: regex }, { slug: regex }, { brand: regex }] });
};

const compareProducts = async (message) => {
    const compareRegex = /so sánh\s+(.+?)\s+(với|vs|và)\s+(.+)/i;
    const match = message.match(compareRegex);
    if (!match) {
        return null;
    }

    const names = [match[1], match[3]];
    const left = await findProductByName(names[0]);
    const right = await findProductByName(names[1]);

    if (!left || !right) {
        return `Không tìm thấy đủ sản phẩm để so sánh. Vui lòng nhập đúng tên hai sản phẩm, ví dụ "so sánh Samsung Galaxy S24 Ultra và Apple iPhone 15 Pro Max".`;
    }

    const compareField = (label, leftValue, rightValue) => `- ${label}: ${leftValue} | ${rightValue}`;
    const leftPrice = left.sale_price || left.base_price || 0;
    const rightPrice = right.sale_price || right.base_price || 0;

    return [`So sánh sản phẩm giữa ${left.name} và ${right.name}:`,
    compareField("Giá", `${leftPrice.toLocaleString()}₫`, `${rightPrice.toLocaleString()}₫`),
    compareField("Danh mục", left.category || 'N/A', right.category || 'N/A'),
    compareField("Thương hiệu", left.brand || 'N/A', right.brand || 'N/A'),
    compareField("Bảo hành", left.warranty || 'Theo chính sách chung', right.warranty || 'Theo chính sách chung'),
    compareField("Số lượng biến thể", `${left.variants?.length || 0}`, `${right.variants?.length || 0}`),
    `Chi tiết xem: /product/${left._id} và /product/${right._id}`
    ].join("\n");
};

const relatedProducts = async (message) => {
    const product = await findProductByName(message);
    if (!product) return null;
    const related = await Product.find({
        _id: { $ne: product._id },
        isDeleted: false,
        category: product.category
    }).limit(4);
    if (!related.length) return null;
    return [`Sản phẩm liên quan với ${product.name}:`]
        .concat(related.map((item, index) => `${index + 1}. ${item.name} - ${item.sale_price || item.base_price || 0}₫. /product/${item._id}`))
        .join("\n");
};

const productInfoResponse = async (message) => {
    const requests = [/thông tin\s+của\s+(.+)/i, /chi tiết\s+(.+)/i, /info\s+(.+)/i];
    for (const regex of requests) {
        const match = message.match(regex);
        if (match) {
            const product = await findProductByName(match[1]);
            if (product) {
                const price = product.sale_price || product.base_price || 0;
                return `Thông tin sản phẩm ${product.name}:
- Danh mục: ${product.category}
- Thương hiệu: ${product.brand || 'N/A'}
- Giá: ${price.toLocaleString()}₫
- Mô tả: ${product.description || 'Chưa có mô tả'}
- Tình trạng kho: ${product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0)} sản phẩm
- Xem chi tiết: /product/${product._id}`;
            }
        }
    }
    return null;
};

const orderTrackingResponse = async (message) => {
    const trackRegex = /mã\s*đơn\s*hàng\s*([A-Za-z0-9-]+)/i;
    const match = message.match(trackRegex);
    if (match) {
        return `Hiện tại hệ thống chưa hỗ trợ tra cứu đơn hàng tự động qua chat. Vui lòng truy cập trang đơn hàng hoặc liên hệ bộ phận chăm sóc khách hàng để kiểm tra mã đơn ${match[1]}.`;
    }
    return `Để theo dõi đơn hàng, bạn vui lòng vào trang "Đơn hàng" sau khi đăng nhập hoặc cung cấp mã đơn hàng để tôi hướng dẫn chi tiết.`;
};

const customerCareResponse = () => {
    return `Chúng tôi luôn sẵn sàng hỗ trợ bạn:
- Kiểm tra đơn hàng, đổi trả, bảo hành.
- Hướng dẫn thanh toán và giao hàng.
- Tư vấn chọn model phù hợp.
Vui lòng cho tôi biết bạn cần hỗ trợ điều gì cụ thể.`;
};

const purchaseGuideResponse = () => {
    return `Hướng dẫn mua hàng:
- Chọn sản phẩm phù hợp với nhu cầu: hiệu năng, camera, pin, kích thước màn hình.
- So sánh các cấu hình và mức giá trước khi quyết định.
- Chọn phương thức thanh toán phù hợp: nhận hàng trả tiền, chuyển khoản hoặc trả góp nếu có.
- Kiểm tra lại thông tin giao hàng trước khi xác nhận đơn.
Nếu bạn cần, tôi có thể gợi ý sản phẩm theo nhu cầu cụ thể của bạn.`;
};

const paymentSupportResponse = () => {
    return `Hỗ trợ thanh toán:
- Chúng tôi hỗ trợ thanh toán khi nhận hàng và chuyển khoản ngân hàng.
- Nếu có trả góp, bạn hãy chọn phương thức trả góp trong lúc thanh toán.
- Kiểm tra chi tiết chính sách thanh toán và hoàn tiền trước khi thanh toán.
- Cần hướng dẫn lựa chọn hình thức thanh toán nào, vui lòng cho tôi biết.`;
};

const customerAssistantResponse = async (message) => {
    const lower = message.toLowerCase();

    if (/(tư vấn sản phẩm|tư vấn mua|tư vấn chọn|tìm sản phẩm|muốn mua|nên mua|gợi ý sản phẩm)/i.test(lower)) {
        return await decisionSupportResponse(message);
    }

    if (/(so sánh|compare|vs|với)/i.test(lower)) {
        const compareText = await compareProducts(message);
        if (compareText) {
            return compareText;
        }
        return 'Hãy gửi tên 2 sản phẩm bạn muốn so sánh, ví dụ: so sánh iPhone 15 và Samsung Galaxy S24.';
    }

    if (/(gợi ý theo nhu cầu|theo nhu cầu|theo tiêu chí|nhu cầu)/i.test(lower)) {
        return await decisionSupportResponse(message);
    }

    if (/(giải đáp chính sách|chính sách|bảo hành|đổi trả|trả hàng|refund|return)/i.test(lower)) {
        const policy = findPolicyAnswer(message);
        if (policy) return policy;
        return `Chúng tôi có chính sách bảo hành, đổi trả và thanh toán rõ ràng. Hãy cho tôi biết bạn muốn biết về chính sách nào: bảo hành, đổi trả, thanh toán hay giao hàng.`;
    }

    if (/(hướng dẫn mua hàng|mua hàng|cách mua|quy trình mua)/i.test(lower)) {
        return purchaseGuideResponse();
    }

    if (/(hỗ trợ thanh toán|thanh toán|payment|trả góp|trả tiền)/i.test(lower)) {
        return paymentSupportResponse();
    }

    if (/(tra cứu đơn hàng|theo dõi đơn hàng|đơn hàng|mã đơn hàng|kiểm tra đơn hàng)/i.test(lower)) {
        return await orderTrackingResponse(message);
    }

    return null;
};

const formatRevenueByPeriod = (periods) => {
    if (!periods.length) {
        return 'Hiện tại chưa có dữ liệu doanh thu theo thời gian.';
    }
    return [`Doanh thu theo thời gian:`]
        .concat(periods.map((item) => {
            const month = item._id.month.toString().padStart(2, '0');
            const year = item._id.year;
            return `- ${month}/${year}: ${item.revenue.toLocaleString()}₫ (${item.orders} đơn)`;
        }))
        .join('\n');
};

const getAdminDashboardResponse = async (message) => {
    const lower = message.toLowerCase();
    const statusCounts = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
    const totalOrders = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const revenueAggregation = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalPrice' } } }
    ]);
    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

    if (/(dashboard|tổng quan|bảng điều khiển)/i.test(lower)) {
        return `Dashboard tổng quan:
- Tổng đơn hàng: ${totalOrders}
- Đơn hoàn thành: ${counts.delivered || 0}
- Đơn bị hủy: ${counts.cancelled || 0}
- Tổng doanh thu: ${totalRevenue.toLocaleString()}₫
- Đơn đang chờ xử lý: ${counts.pending || 0}
- Đơn đang giao: ${counts.shipping || 0}`;
    }

    if (/(tổng doanh thu|doanh thu tổng|doanh thu)(?! theo thời gian)/i.test(lower)) {
        return `Tổng doanh thu hiện tại: ${totalRevenue.toLocaleString()}₫\nTổng số đơn hàng không bao gồm đơn hủy: ${totalOrders - (counts.cancelled || 0)}`;
    }

    if (/(doanh thu theo thời gian|theo thời gian)/i.test(lower)) {
        const periods = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$finalPrice' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
        ]);
        return formatRevenueByPeriod(periods.reverse());
    }

    if (/(tổng đơn hàng|số đơn hàng)/i.test(lower)) {
        return `Tổng đơn hàng: ${totalOrders}\n- Đơn hoàn thành: ${counts.delivered || 0}\n- Đơn đang giao: ${counts.shipping || 0}\n- Đơn bị hủy: ${counts.cancelled || 0}`;
    }

    if (/(đơn hoàn thành|hoàn thành)/i.test(lower) && !/(hủy|huỷ|cancel)/i.test(lower)) {
        return `Số đơn hoàn thành: ${counts.delivered || 0}`;
    }

    if (/(đơn bị hủy|đơn hủy|đơn huỷ|hủy|huỷ)/i.test(lower)) {
        return `Số đơn bị hủy hiện tại: ${counts.cancelled || 0}`;
    }

    if (/(thống kê sản phẩm)/i.test(lower)) {
        const totalProducts = await Product.countDocuments({ isDeleted: false });
        const lowStockProducts = await Product.find({ isDeleted: false, variants: { $elemMatch: { stock: { $lte: 10 } } } }).limit(5);
        return `Thống kê sản phẩm:
- Tổng số sản phẩm: ${totalProducts}
- Sản phẩm sắp hết hàng (<= 10): ${lowStockProducts.length}
${lowStockProducts.slice(0, 5).map((product, index) => `  ${index + 1}. ${product.name}`).join('\n')}`;
    }

    if (/(sản phẩm bán chạy|bán chạy|top sản phẩm)/i.test(lower)) {
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    quantity: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);
        return [`Top sản phẩm bán chạy:`]
            .concat(topProducts.map((item, index) => `- ${index + 1}. ${item.product.name} (${item.quantity} bán) - ${item.revenue.toLocaleString()}₫`))
            .join('\n');
    }

    if (/(thương hiệu nổi bật|thương hiệu)/i.test(lower)) {
        const topBrands = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.brand',
                    quantity: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 5 }
        ]);
        if (!topBrands.length) {
            return 'Hiện tại chưa có dữ liệu thương hiệu nổi bật.';
        }
        return [`Thương hiệu nổi bật:`]
            .concat(topBrands.map((item, index) => `- ${index + 1}. ${item._id || 'Không rõ'}: ${item.quantity} sản phẩm bán ra, doanh thu ${item.revenue.toLocaleString()}₫`))
            .join('\n');
    }

    return null;
};

const decisionSupportResponse = async (message) => {
    const products = await findProductRecommendations(message);
    return `Dựa trên yêu cầu của bạn, tôi gợi ý:
${products.map((product, idx) => {
        const price = product.sale_price || product.base_price || 0;
        return `${idx + 1}. ${product.name} - ${price.toLocaleString()}₫. /product/${product._id}`;
    }).join("\n")}`;
};

const getRecommendations = async (query) => {
    const { keyword, category } = query;
    const filter = { isDeleted: false };

    if (category) {
        filter.category = category;
    }

    if (keyword) {
        filter.$or = [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
            { category: { $regex: keyword, $options: "i" } },
            { brand: { $regex: keyword, $options: "i" } }
        ];
    }

    return await Product.find(filter).limit(8);
};

const getChatHistory = async (userId) => {
    return await Chat.findOne({ userId, isActive: true });
};

const generateAdminInsight = async ({ type, prompt }) => {
    const lowerType = (type || '').toLowerCase();
    const text = prompt || '';

    const revenueAggregation = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$finalPrice' }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: '$finalPrice' } } }
    ]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(50);
    const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, quantity: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', category: '$product.category', revenue: 1, quantity: 1 } }
    ]);

    if (lowerType.includes('revenue') || lowerType.includes('doanh thu')) {
        const overview = revenueAggregation[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
        return `Phân tích doanh thu:
- Tổng doanh thu: ${overview.totalRevenue.toLocaleString()}₫
- Tổng đơn hàng: ${overview.totalOrders}
- Giá trị đơn hàng trung bình: ${overview.avgOrderValue.toFixed(2).toLocaleString()}₫
- Top sản phẩm theo doanh thu:
${topProducts.map((product, index) => `${index + 1}. ${product.name} - ${product.revenue.toLocaleString()}₫ (${product.quantity} bán ra)`).join('\n')}`;
    }

    if (lowerType.includes('inventory') || lowerType.includes('tồn kho')) {
        const allProducts = await Product.find({ isDeleted: false });
        const lowStock = allProducts.filter((product) => product.variants?.some((v) => v.stock <= 10));
        const totalStock = allProducts.reduce((sum, product) => sum + (product.variants?.reduce((innerSum, v) => innerSum + (v.stock || 0), 0) || 0), 0);
        return `Phân tích tồn kho:
- Số lượng sản phẩm: ${allProducts.length}
- Tổng tồn kho: ${totalStock}
- Sản phẩm sắp hết hàng (stock <= 10): ${lowStock.length}
${lowStock.slice(0, 5).map((product, index) => `${index + 1}. ${product.name}: ${product.variants?.reduce((innerSum, v) => innerSum + (v.stock || 0), 0)} sản phẩm`).join('\n')}`;
    }

    if (lowerType.includes('behavior') || lowerType.includes('hành vi')) {
        const users = await User.find();
        const repeatBuyers = await Order.aggregate([
            { $group: { _id: '$user', orders: { $sum: 1 } } },
            { $match: { orders: { $gt: 1 } } },
            { $count: 'repeatCount' }
        ]);
        const categoryCount = await Order.aggregate([
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' },
            { $group: { _id: '$productDetails.category', count: { $sum: '$items.quantity' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        return `Phân tích hành vi khách hàng:
- Tổng khách hàng: ${users.length}
- Khách hàng mua lại: ${repeatBuyers[0]?.repeatCount || 0}
- Danh mục được mua nhiều nhất:
${categoryCount.map((item, index) => `${index + 1}. ${item._id || 'Khác'} - ${item.count} sản phẩm`).join('\n')}`;
    }

    if (lowerType.includes('product_content') || lowerType.includes('nội dung sản phẩm') || lowerType.includes('tạo nội dung sản phẩm')) {
        const product = await findProductByName(text);
        if (!product) {
            return `Vui lòng cung cấp tên sản phẩm cụ thể để tôi tạo nội dung mô tả sản phẩm.`;
        }
        return `Mô tả sản phẩm cho ${product.name}:
- ${product.description || 'Sản phẩm cao cấp, thiết kế đẹp, cấu hình mạnh và trải nghiệm mượt mà.'}
- Thương hiệu: ${product.brand || 'N/A'}
- Danh mục: ${product.category}
- Giá: ${product.sale_price?.toLocaleString() || product.base_price?.toLocaleString() || 'Liên hệ'}₫
- Điểm nổi bật: ${product.design_features?.slice(0, 3).join(', ') || 'Hiệu năng ổn định, camera ấn tượng, pin lâu.'}`;
    }

    if (lowerType.includes('marketing') || lowerType.includes('nội dung marketing')) {
        if (!text) {
            return `Vui lòng nhập tên sản phẩm hoặc loại chiến dịch để tôi tạo nội dung marketing.`;
        }
        return `Nội dung marketing gợi ý cho "${text}":
- Khám phá ${text} với thiết kế sang trọng, camera sắc nét và hiệu năng vượt trội.
- Mua ngay hôm nay để nhận ưu đãi đặc biệt, trả góp 0% và bảo hành chính hãng.
- Sản phẩm phù hợp cho cả công việc và giải trí.`;
    }

    if (lowerType.includes('reviews') || lowerType.includes('đánh giá')) {
        return `Hiện tại hệ thống chưa có module đánh giá khách hàng đầy đủ. Bạn có thể thêm mô-đun review để thu thập ý kiến khách hàng, sau đó tôi sẽ hỗ trợ tổng hợp và phân tích.`;
    }

    if (lowerType.includes('orders') || lowerType.includes('đơn hàng')) {
        const statusCounts = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        return `Thống kê đơn hàng:
${statusCounts.map((item) => `- ${item._id}: ${item.count}`).join('\n')}`;
    }

    if (lowerType.includes('trend') || lowerType.includes('xu hướng')) {
        const categoryCount = await Order.aggregate([
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' },
            { $group: { _id: '$productDetails.category', quantity: { $sum: '$items.quantity' } } },
            { $sort: { quantity: -1 } },
            { $limit: 5 }
        ]);
        return `Dự đoán xu hướng bán hàng:
${categoryCount.map((item, index) => `${index + 1}. ${item._id || 'Khác'} - ${item.quantity} sản phẩm bán ra`).join('\n')}
Khách hàng đang quan tâm nhiều tới các danh mục này.`;
    }

    if (lowerType.includes('system') || lowerType.includes('quản trị') || lowerType.includes('hệ thống')) {
        const productCount = await Product.countDocuments({ isDeleted: false });
        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        return `Tổng quan hệ thống:
- Số sản phẩm: ${productCount}
- Số người dùng: ${userCount}
- Số đơn hàng: ${orderCount}
- Top sản phẩm theo doanh thu: ${topProducts.slice(0, 3).map((item, index) => `${index + 1}. ${item.name}`).join(', ')}`;
    }

    if (lowerType.includes('chatbot') || lowerType.includes('nội bộ') || lowerType.includes('admin')) {
        return `AI admin có thể hỗ trợ:
- Phân tích doanh thu, tồn kho, hành vi khách hàng
- Tạo nội dung sản phẩm, nội dung marketing
- Thống kê đơn hàng và dự đoán xu hướng
- Hỗ trợ trả lời câu hỏi nội bộ về quản trị
Bạn có thể chọn loại báo cáo hoặc nhập câu hỏi cụ thể.`;
    }

    return `Vui lòng chọn một loại phân tích admin: revenue, inventory, behavior, product_content, marketing, reviews, orders, trend, system, chatbot. Hoặc viết câu hỏi cụ thể.`;
};

const findPolicyAnswer = (message) => {
    const lowerMessage = message.toLowerCase();
    for (const policy of policyResponses) {
        for (const key of policy.keys) {
            if (lowerMessage.includes(key.toLowerCase())) {
                return policy.answer;
            }
        }
    }
    return null;
};

const findProductRecommendations = async (message) => {
    try {
        const filter = buildSearchFilter(message);
        const products = await Product.find(filter).limit(6);
        return products;
    } catch (err) {
        console.error("Error in findProductRecommendations:", err);
        return [];
    }
};

const generateChatResponse = async (userMessage, userId) => {
    const lowerMessage = (userMessage || '').toLowerCase();
    // run intent detection early
    try {
        const intent = intentService.detectIntent(userMessage || '');
        if (intent && intent.score > 0.2) {
            // FAQ intents
            if (intent.type === 'faq') {
                const policy = findPolicyAnswer(lowerMessage);
                if (policy) return policy;
            }
            if (intent.type === 'recommend') {
                const products = await findProductRecommendations(userMessage);
                return formatProductList(products);
            }
            if (intent.type === 'product_info') {
                const info = await productInfoResponse(lowerMessage);
                if (info) return info;
            }
            if (intent.type === 'compare') {
                const cmp = await compareProducts(lowerMessage);
                if (cmp) return cmp;
            }
            if (intent.type === 'order') {
                return await orderTrackingResponse(lowerMessage);
            }
        }
    } catch (e) {
        console.error('Intent detection error:', e);
    }
    const history = await getChatHistory(userId);
    const recentUserMessages = history?.messages
        .filter((entry) => entry.sender === "user")
        .slice(-3)
        .map((entry) => entry.message)
        .join(". ");

    const policyAnswer = findPolicyAnswer(lowerMessage);
    if (policyAnswer) {
        return policyAnswer;
    }

    const customerResponse = await customerAssistantResponse(userMessage);
    if (customerResponse) {
        return customerResponse;
    }

    const adminResponse = await getAdminDashboardResponse(lowerMessage);
    if (adminResponse) {
        return adminResponse;
    }

    const productInfo = await productInfoResponse(lowerMessage);
    if (productInfo) {
        return productInfo;
    }

    if (/(so sánh|compare)/i.test(lowerMessage)) {
        const compareText = await compareProducts(lowerMessage);
        if (compareText) {
            return compareText;
        }
    }

    if (/(liên quan|tương tự|similar|related)/i.test(lowerMessage)) {
        const related = await relatedProducts(lowerMessage);
        if (related) {
            return related;
        }
    }

    if (/(theo dõi đơn hàng|mã đơn hàng|track)/i.test(lowerMessage)) {
        return await orderTrackingResponse(lowerMessage);
    }

    if (/(chăm sóc khách hàng|support|hỗ trợ khách hàng)/i.test(lowerMessage)) {
        return customerCareResponse();
    }

    if (/(quyết định|nên|nên mua|tư vấn mua|gợi ý nên|cần mua)/i.test(lowerMessage)) {
        return await decisionSupportResponse(lowerMessage);
    }

    if (/(gợi ý|recommend|tư vấn|tìm|muốn|cần|giao hàng|shipping)/i.test(lowerMessage)) {
        const products = await findProductRecommendations(userMessage);
        return formatProductList(products);
    }

    if (/(giá|price|mua|bán|sale|khuyến mãi)/i.test(lowerMessage)) {
        if (/(khuyến mãi|sale)/i.test(lowerMessage)) {
            return `Hiện tại chúng tôi có nhiều ưu đãi cho khách hàng. Hãy cho tôi biết bạn muốn mua sản phẩm nào, chẳng hạn như iPhone, Samsung, Xiaomi, hoặc một chiếc tablet để tôi gợi ý cụ thể hơn.`;
        }
        return `Chúng tôi có sản phẩm từ nhiều phân khúc: giá rẻ, tầm trung và cao cấp. Bạn cần gợi ý sản phẩm theo mức giá nào hoặc hãng nào không?`;
    }

    if (/(bảo hành|hỗ trợ|đổi trả|chính sách)/i.test(lowerMessage)) {
        const policy = findPolicyAnswer(lowerMessage);
        if (policy) return policy;
        return `Chúng tôi hỗ trợ chính sách bảo hành và đổi trả rõ ràng. Bạn cần biết chi tiết về bảo hành, đổi trả hay thanh toán?`;
    }

    if (recentUserMessages) {
        const contextProducts = await findProductRecommendations(recentUserMessages + " " + userMessage);
        if (contextProducts.length) {
            return formatProductList(contextProducts);
        }
    }

    return fallbackResponse;
};

const saveMessage = async (userId, sender, message) => {
    let chat = await Chat.findOne({ userId, isActive: true });
    if (!chat) {
        chat = new Chat({ userId, messages: [] });
    }
    chat.messages.push({ sender, message });
    chat.updatedAt = new Date();
    await chat.save();
    return chat;
};

const getAllChatsForAdmin = async () => {
    return await Chat.find({ isActive: true }).populate("userId", "name email");
};

module.exports = { getRecommendations, generateChatResponse, generateAdminInsight, saveMessage, getChatHistory, getAllChatsForAdmin };

