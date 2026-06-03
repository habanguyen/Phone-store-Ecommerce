const Product = require("../models/product.model");
const Chat = require("../models/chat.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const intentService = require("./intent.service");
const entityService = require("./entity.service");
const slotFillingService = require("./slotfilling.service");

const policyResponses = [
    {
        keys: ["giao hàng", "shipping", "vận chuyển", "ship", "giao"],
        answer: `Chính sách giao hàng:
- Giao hàng toàn quốc trong 1-3 ngày làm việc tùy khu vực.
- Miễn phí giao hàng cho đơn hàng trên giá trị quy định.
- Hỗ trợ kiểm tra đơn hàng và theo dõi vận đơn qua mã đơn.
- Vui lòng xác nhận địa chỉ chính xác để nhận hàng nhanh nhất.`
    },
    {
        keys: ["bảo hành", "warranty", "chính sách bảo hành"],
        answer: `Chính sách bảo hành của chúng tôi:
- Bảo hành chính hãng 12 tháng cho điện thoại và 6 tháng cho phụ kiện.
- 1 đổi 1 trong 30 ngày nếu lỗi kỹ thuật từ nhà sản xuất.
- Hãy giữ lại hóa đơn hoặc mã đơn hàng để hỗ trợ nhanh hơn.
Nếu bạn cần tư vấn chi tiết về sản phẩm hoặc mã đơn hàng, vui lòng cho tôi biết.`
    },
    {
        keys: ["đổi trả", "trả hàng", "refund", "return", "đổi hàng", "hoàn tiền"],
        answer: `Chính sách đổi trả:
- Đổi trả trong 7 ngày nếu sản phẩm lỗi kỹ thuật hoặc khác mô tả.
- Hỗ trợ đổi 1 lấy 1 trong 30 ngày khi có lỗi từ nhà sản xuất.
- Giữ nguyên hộp, tem và phiếu mua hàng để hợp lệ.
- Liên hệ CSKH để được hướng dẫn chi tiết và nhanh chóng.`
    },
    {
        keys: ["trả góp", "installment", "phương thức thanh toán", "thanh toán", "payment"],
        answer: `Chúng tôi hỗ trợ các phương thức thanh toán sau:
- Thanh toán trực tiếp khi nhận hàng.
- Chuyển khoản ngân hàng / thẻ nội địa.
- Thanh toán trả góp qua đối tác tài chính (nếu có).
Vui lòng cho biết bạn muốn trả góp bao nhiêu phần trăm hoặc hình thức thanh toán để tôi hỗ trợ chi tiết.`
    },
    {
        keys: ["mã giảm giá", "coupon", "khuyến mãi", "voucher", "ưu đãi"],
        answer: `Chính sách khuyến mãi:
- Trang web thường xuyên có mã giảm giá và ưu đãi theo từng chương trình.
- Hãy kiểm tra phần Khuyến mãi hoặc thông báo ngay trước khi thanh toán.
- Nếu bạn muốn, tôi có thể giúp bạn tìm sản phẩm đang có ưu đãi phù hợp.`
    }
];

const fallbackResponse = `Xin chào! Tôi là trợ lý mua sắm thông minh của hệ thống.
Tôi có thể giúp bạn:
- Tư vấn chọn điện thoại theo nhu cầu
- So sánh sản phẩm và kiểm tra tính năng
- Trả lời chính sách giao hàng, thanh toán, bảo hành và đổi trả
- Hỗ trợ theo dõi đơn hàng và tài khoản
Nói cho tôi biết bạn cần gì nhé.`;

const extractWords = (text) => text.match(/\p{L}+/gu)?.filter((word) => word.length > 1) || [];

const faqAnswerMap = {
    shipping: policyResponses.find((item) => item.keys.includes('giao hàng')).answer,
    payment: policyResponses.find((item) => item.keys.includes('payment')).answer,
    warranty: policyResponses.find((item) => item.keys.includes('bảo hành')).answer,
    refund: policyResponses.find((item) => item.keys.includes('refund')).answer,
    coupon: policyResponses.find((item) => item.keys.includes('coupon')).answer
};

const salesRecommendationTerms = {
    recommend_gaming: ['game', 'gaming', 'fps', 'mượt', 'snapdragon', 'play', 'chơi game', 'Liên Quân', 'PUBG', 'Genshin'],
    recommend_camera: ['camera', 'chụp', 'zoom', 'selfie', 'ảnh', 'night', 'quay video', 'TikTok', '4K', 'du lịch', 'chụp đêm', 'chân dung'],
    recommend_battery: ['pin', 'pin lâu', 'dung lượng pin', 'sạc', 'pin trâu', 'fast charge', 'dùng 2 ngày', 'công tác', 'sạc nhanh'],
    recommend_student: ['sinh viên', 'học', 'giá rẻ', 'tiết kiệm', 'dùng học', 'bình dân', 'học online', 'sinh viên CNTT'],
    recommend_flagship: ['flagship', 'cao cấp', 'đỉnh', 'premium', 'Pro', 'Ultra', 'mạnh nhất', 'siêu phẩm'],
    recommend_office: ['văn phòng', 'office', 'công việc', 'email', 'excel', 'zoom', 'họp trực tuyến', 'đa nhiệm', 'làm việc'],
    recommend_creator: ['creator', 'sáng tạo', 'edit', 'video', 'content', 'studio', 'vlog', 'livestream', 'TikTok'],
    recommend_general: ['điện thoại', 'tư vấn điện thoại', 'nên mua', 'đáng mua', 'giá dưới', 'tầm', 'triệu', 'dưới'],
    recommend_ios: ['ios', 'iphone', 'apple'],
    recommend_android: ['android', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme'],
    recommend_compact: ['nhỏ gọn', 'compact', 'dễ cầm', 'mini', 'gọn nhẹ']
};

const escapeForRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const USAGE_SEARCH_TERMS = {
    gaming: ['game', 'gaming', 'fps', 'hiệu năng', 'chơi game', 'snapdragon', 'mediatek', 'game mobile'],
    office: ['văn phòng', 'office', 'công việc', 'email', 'excel', 'word', 'zoom', 'họp trực tuyến'],
    content_creation: ['camera', 'chụp ảnh', 'video', 'edit', 'tiktok', 'instagram', 'content', 'sáng tạo'],
    student: ['sinh viên', 'học', 'giá rẻ', 'tiết kiệm', 'dùng học', 'màn hình lớn', 'pin ổn'],
    navigation: ['điều hướng', 'bản đồ', 'gps', 'dẫn đường'],
    music: ['nghe nhạc', 'âm nhạc', 'loa', 'âm thanh', 'nhạc'],
    entertainment: ['xem phim', 'youtube', 'video', 'streaming', 'giải trí']
};

const FEATURE_SEARCH_TERMS = {
    long_battery_life: ['pin', 'pin lâu', 'pin trâu', 'dung lượng pin', 'sạc lâu'],
    camera: ['camera', 'chụp', 'zoom', 'selfie', 'ảnh đẹp', 'night mode', 'video'],
    gaming: ['game', 'fps', 'mượt', 'hiệu năng', 'snapdragon', 'mediatek'],
    performance: ['chip', 'ram', 'processor', 'hiệu năng', 'mạnh'],
    portable: ['nhỏ gọn', 'gọn nhẹ', 'mỏng', 'dễ cầm'],
    display: ['màn hình', 'amoled', 'oled', '120hz', 'refresh rate', 'độ phân giải'],
    fast_charging: ['sạc nhanh', 'fast charge', '65w', '100w', 'quick charge'],
    connectivity: ['5g', 'wifi 6', 'bluetooth', 'nfc'],
    durability: ['chống nước', 'ip67', 'ip68', 'waterproof', 'bền'],
    budget: ['giá rẻ', 'tiết kiệm', 'bình dân', 'giá thấp', 'điện thoại giá rẻ']
};

const buildProductQuery = (message, intentName) => {
    const entities = entityService.extractEntitiesByIntent(message, intentName);
    const lower = (message || '').toLowerCase();
    const conditions = [
        { isDeleted: false },
        { is_active: true }
    ];

    if (entities.brand) {
        conditions.push({ brand: entities.brand });
    }

    if (intentName === 'recommend_ios') {
        conditions.push({ brand: 'Apple' });
    }

    if (intentName === 'recommend_android') {
        conditions.push({ brand: { $ne: 'Apple' } });
    }

    if (['recommend_gaming', 'recommend_camera', 'recommend_battery', 'recommend_flagship', 'recommend_office', 'recommend_creator', 'recommend_ios', 'recommend_android', 'recommend_compact', 'recommend_general'].includes(intentName)) {
        conditions.push({ category: 'Smartphone' });
    }

    const variantMatch = {};
    if (entities.storage) {
        variantMatch.storage = new RegExp(`\\b${entities.storage.value}\\s*${entities.storage.unit}\\b`, 'i');
    }
    if (entities.color) {
        variantMatch.color = new RegExp(escapeForRegex(entities.color), 'i');
    }

    const priceEntity = entities.price_range || entities.budget;
    if (priceEntity) {
        const priceCond = {};
        if (priceEntity.operator === '<') {
            priceCond.$lt = priceEntity.value;
        } else if (priceEntity.operator === '>') {
            priceCond.$gt = priceEntity.value;
        } else if (priceEntity.operator === 'range') {
            priceCond.$gte = priceEntity.min;
            priceCond.$lte = priceEntity.max;
        } else if (priceEntity.operator === '=') {
            priceCond.$eq = priceEntity.value;
        }

        if (Object.keys(variantMatch).length > 0) {
            variantMatch.price = priceCond;
        } else {
            conditions.push({
                $or: [
                    { sale_price: priceCond },
                    { base_price: priceCond },
                    { variants: { $elemMatch: { price: priceCond } } }
                ]
            });
        }
    }

    if (Object.keys(variantMatch).length > 0) {
        conditions.push({ variants: { $elemMatch: variantMatch } });
    }

    const textFilters = [];
    const intentTerms = salesRecommendationTerms[intentName] || [];
    const usageTerms = entities.usage && USAGE_SEARCH_TERMS[entities.usage] ? USAGE_SEARCH_TERMS[entities.usage] : [];
    const featureTerms = entities.features ? entities.features.flatMap((feature) => FEATURE_SEARCH_TERMS[feature] || [feature]) : [];
    const messageTerms = extractWords(message).slice(0, 8);
    const searchTerms = [...new Set([...intentTerms, ...usageTerms, ...featureTerms, ...messageTerms])];

    searchTerms.forEach((term) => {
        if (!term) return;
        textFilters.push({ description: { $regex: escapeForRegex(term), $options: 'i' } });
        textFilters.push({ name: { $regex: escapeForRegex(term), $options: 'i' } });
        textFilters.push({ brand: { $regex: escapeForRegex(term), $options: 'i' } });
        textFilters.push({ category: { $regex: escapeForRegex(term), $options: 'i' } });
    });

    if (textFilters.length > 0) {
        conditions.push({ $or: textFilters });
    }

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

const buildRecommendationFilter = (intentName, message) => {
    return buildProductQuery(message, intentName);
};

const buildSearchFilter = (message) => {
    return buildProductQuery(message, null);
};

const scoreProductMatches = (products, message, intentName) => {
    const entities = entityService.extractEntitiesByIntent(message, intentName);
    const text = (message || '').toLowerCase();
    const productMatches = products.map((product) => {
        let score = 0;
        const productText = `${product.name || ''} ${product.description || ''}`.toLowerCase();

        if (entities.brand && product.brand === entities.brand) {
            score += 30;
        }
        if (intentName === 'recommend_ios' && product.brand === 'Apple') {
            score += 20;
        }
        if (intentName === 'recommend_android' && product.brand !== 'Apple') {
            score += 15;
        }
        if (intentName && salesRecommendationTerms[intentName]) {
            salesRecommendationTerms[intentName].forEach((term) => {
                if (productText.includes(term.toLowerCase())) score += 8;
            });
        }
        if (entities.usage && USAGE_SEARCH_TERMS[entities.usage]) {
            USAGE_SEARCH_TERMS[entities.usage].forEach((term) => {
                if (productText.includes(term.toLowerCase())) score += 8;
            });
        }
        if (entities.features) {
            entities.features.forEach((feature) => {
                const terms = FEATURE_SEARCH_TERMS[feature] || [feature];
                terms.forEach((term) => {
                    if (productText.includes(term.toLowerCase())) score += 6;
                });
            });
        }

        extractWords(message).forEach((term) => {
            if (productText.includes(term.toLowerCase())) score += 1;
        });

        const priceEntity = entities.price_range || entities.budget;
        const matchPrice = Math.min(
            product.sale_price || Infinity,
            product.base_price || Infinity,
            ...(product.variants || []).map((v) => v.price || Infinity)
        );
        if (priceEntity && isFinite(matchPrice)) {
            if (priceEntity.operator === '<' && matchPrice <= priceEntity.value) {
                score += 12;
            } else if (priceEntity.operator === '>' && matchPrice >= priceEntity.value) {
                score += 10;
            } else if (priceEntity.operator === 'range' && matchPrice >= priceEntity.min && matchPrice <= priceEntity.max) {
                score += 14;
            }
            if (priceEntity.operator === '<') {
                score += Math.max(0, 5 - Math.floor((matchPrice || 0) / (priceEntity.value / 5)));
            }
        }

        if (product.category && text.includes(product.category.toLowerCase())) {
            score += 5;
        }

        return { product, score };
    });

    return productMatches
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
};

const recommendProductsByIntent = async (intentName, message) => {
    const entities = entityService.extractEntitiesByIntent(message, intentName);
    const filter = buildRecommendationFilter(intentName, message);

    try {
        let products = await Product.find(filter).limit(20);
        products = scoreProductMatches(products, message, intentName).slice(0, 6);

        if (products.length < 3) {
            const fallbackQuery = buildProductQuery(message, null);
            products = await Product.find(fallbackQuery).limit(20);
            products = scoreProductMatches(products, message, intentName).slice(0, 6);
        }

        console.log(`[Entity Extraction] Intent: ${intentName}, Entities:`, entities);

        if (products.length) {
            return products;
        }

        return await findProductRecommendations(message);
    } catch (err) {
        console.error('Error in recommendProductsByIntent:', err);
        return await findProductRecommendations(message);
    }
};

const getFaqAnswer = (intentName, message) => {
    if (!intentName) return null;
    if (intentName === 'shipping') return faqAnswerMap.shipping;
    if (intentName === 'payment') return faqAnswerMap.payment;
    if (intentName === 'warranty') return faqAnswerMap.warranty;
    if (intentName === 'refund') return faqAnswerMap.refund;
    if (intentName === 'coupon') return faqAnswerMap.coupon;
    return null;
};

const stockCheckResponse = async (message) => {
    const regex = /(?:còn hàng|tồn kho|hết hàng).*?([\p{L}0-9\s\-]+)/iu;
    const match = message.match(regex);
    if (match) {
        const product = await findProductByName(match[1].trim());
        if (product) {
            const available = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
            return `Sản phẩm ${product.name} hiện có ${available} chiếc trong kho. Bạn có thể xem chi tiết: /product/${product._id}`;
        }
    }
    return `Vui lòng cho tôi biết tên sản phẩm bạn muốn kiểm tra tồn kho, ví dụ: "còn hàng iPhone 15".`;
};

const cancelOrderResponse = () => {
    return `Nếu bạn muốn hủy đơn hàng, vui lòng cung cấp mã đơn hàng hoặc vào trang quản lý đơn hàng.
- Đơn hàng chỉ có thể hủy nếu chưa giao.
- Nếu cần trợ giúp nhanh, hãy liên hệ bộ phận chăm sóc khách hàng để xử lý.`;
};

const accountSupportResponse = () => {
    return `Hỗ trợ tài khoản:
- Nếu quên mật khẩu, hãy sử dụng chức năng "Quên mật khẩu" trên trang đăng nhập.
- Nếu không đăng nhập được, kiểm tra email và mật khẩu, sau đó thử đặt lại mật khẩu.
- Nếu tài khoản bị khóa, liên hệ bộ phận hỗ trợ để mở lại.`;
};

const humanSupportResponse = () => {
    return `Tôi sẽ chuyển bạn tới bộ phận chăm sóc khách hàng. Vui lòng gọi hotline hoặc gửi yêu cầu qua trang liên hệ để được hỗ trợ trực tiếp.`;
};

const thankYouResponse = () => {
    return `Rất vui được hỗ trợ bạn. Nếu bạn cần thêm tư vấn sản phẩm hoặc chính sách, cứ tiếp tục hỏi nhé.`;
};

const goodbyeResponse = () => {
    return `Cảm ơn bạn đã trò chuyện. Chúc bạn có mua sắm vui vẻ và nếu cần trợ giúp thêm, tôi luôn sẵn sàng.`;
};

const humanSupportKeywords = ['nhân viên', 'hỗ trợ trực tiếp', 'tư vấn viên', 'chuyển sang nhân viên', 'live agent'];

const policyKeys = policyResponses.flatMap((item) => item.keys.map((key) => key.toLowerCase()));

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

const formatProductListWithEntities = (products, entities) => {
    if (!products || products.length === 0) {
        const criteria = [];
        if (entities?.brand) criteria.push(`hãng ${entities.brand}`);
        if (entities?.price_range) {
            if (entities.price_range.operator === '<') criteria.push(`giá dưới ${(entities.price_range.value / 1000000).toFixed(0)}tr`);
            else if (entities.price_range.operator === '>') criteria.push(`giá trên ${(entities.price_range.value / 1000000).toFixed(0)}tr`);
            else if (entities.price_range.operator === 'range') criteria.push(`giá từ ${(entities.price_range.min / 1000000).toFixed(0)}tr - ${(entities.price_range.max / 1000000).toFixed(0)}tr`);
        }
        if (entities?.storage) criteria.push(`dung lượng ${entities.storage.value}${entities.storage.unit}`);
        if (entities?.color) criteria.push(`màu ${entities.color}`);

        const criteriaStr = criteria.length > 0 ? ` theo tiêu chí: ${criteria.join(', ')}` : '';
        return `Hiện tại tôi chưa tìm được sản phẩm phù hợp${criteriaStr}. Bạn có thể thử với tiêu chí khác hoặc cho biết thêm yêu cầu.`;
    }

    const header = ['Dưới đây là các sản phẩm phù hợp với yêu cầu của bạn:'];

    if (entities?.brand) header.push(`(Hãng: ${entities.brand})`);
    if (entities?.price_range) {
        if (entities.price_range.operator === '<') header.push(`(Giá: dưới ${(entities.price_range.value / 1000000).toFixed(0)}tr đ)`);
        else if (entities.price_range.operator === '>') header.push(`(Giá: trên ${(entities.price_range.value / 1000000).toFixed(0)}tr đ)`);
        else if (entities.price_range.operator === 'range') header.push(`(Giá: ${(entities.price_range.min / 1000000).toFixed(0)}tr - ${(entities.price_range.max / 1000000).toFixed(0)}tr đ)`);
    }

    return header.concat(
        products.map((product, index) => {
            const price = product.sale_price || product.base_price || 0;
            return `${index + 1}. ${product.name} (${product.category}) - ${price.toLocaleString()}₫. Xem chi tiết: /product/${product._id}`;
        })
    ).join("\n");
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

    if (/\b(cảm ơn|thanks|thank you)\b/.test(lower)) {
        return thankYouResponse();
    }

    if (/\b(tạm biệt|bye|hẹn gặp lại|chào tạm biệt)\b/.test(lower)) {
        return goodbyeResponse();
    }

    if (humanSupportKeywords.some((keyword) => lower.includes(keyword))) {
        return humanSupportResponse();
    }

    if (/(nên mua|tư vấn sản phẩm|tư vấn mua|tư vấn chọn|gợi ý sản phẩm|phù hợp cho tôi|muốn mua)/i.test(lower)) {
        return await decisionSupportResponse(message);
    }

    if (/(so sánh|compare|vs|với)/i.test(lower)) {
        const compareText = await compareProducts(message);
        if (compareText) return compareText;
        return 'Hãy gửi tên hai sản phẩm bạn muốn so sánh, ví dụ: "so sánh iPhone 15 và Samsung Galaxy S24".';
    }

    if (/(còn hàng|tồn kho|hết hàng)/i.test(lower)) {
        return await stockCheckResponse(message);
    }

    if (/(hủy đơn|cancel order|hủy mua)/i.test(lower)) {
        return cancelOrderResponse();
    }

    if (/(tài khoản|đăng nhập|quên mật khẩu|mở khóa tài khoản)/i.test(lower)) {
        return accountSupportResponse();
    }

    if (/(chính sách|bảo hành|đổi trả|trả hàng|refund|return|thanh toán|payment|giao hàng|shipping)/i.test(lower)) {
        const policy = findPolicyAnswer(message);
        if (policy) return policy;
        return `Chúng tôi có chính sách rõ ràng về giao hàng, thanh toán, bảo hành và đổi trả. Hãy cho tôi biết bạn muốn biết chi tiết về vấn đề nào.`;
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
        const filter = buildProductQuery(message, null);
        let products = await Product.find(filter).limit(20);
        products = scoreProductMatches(products, message, null).slice(0, 6);
        return products;
    } catch (err) {
        console.error("Error in findProductRecommendations:", err);
        return [];
    }
};

const getSessionIntent = (chat, currentIntent) => {
    if (!chat || !chat.currentIntent) return currentIntent;
    const sessionIntent = intentService.getIntentByName(chat.currentIntent);
    if (!sessionIntent) return currentIntent;
    if (chat.pendingSlot) {
        return sessionIntent;
    }
    if (!currentIntent || currentIntent.name === 'fallback' || currentIntent.group === 'system') {
        return sessionIntent;
    }
    return currentIntent;
};

const generateChatResponse = async (userMessage, userId) => {
    const lowerMessage = (userMessage || '').toLowerCase();
    let intent = { name: 'fallback', score: 0, group: 'system' };

    let chat = null;
    try {
        chat = await Chat.findOne({ userId, isActive: true });
    } catch (err) {
        console.error('Error fetching chat for session context:', err);
    }

    try {
        intent = intentService.detectIntent(userMessage || '');
        intent = getSessionIntent(chat, intent);
    } catch (e) {
        console.error('Intent detection error:', e);
    }

    if (intent.group === 'system') {
        if (intent.name === 'greeting') return `Xin chào! Tôi là AI Product Advisor. Bạn đang tìm thiết bị nào hoặc cần tư vấn gì?`;
        if (intent.name === 'thanks') return thankYouResponse();
        if (intent.name === 'goodbye') return goodbyeResponse();
        if (intent.name === 'human_support') return humanSupportResponse();
    }

    if (intent.group === 'faq') {
        const answer = getFaqAnswer(intent.name, userMessage);
        if (answer) return answer;
    }

    if (intent.group === 'sales') {
        // Extract entities from user message
        const entities = entityService.extractEntitiesByIntent(userMessage, intent.name);

        // Get chat history to check existing slots
        let chatHistory = [];
        try {
            const chat = await Chat.findOne({ userId }).sort({ createdAt: -1 });
            if (chat) {
                chatHistory = chat.messages || [];
            }
        } catch (err) {
            console.error('Error fetching chat history:', err);
        }

        // Build slot context from chat history
        const currentSlots = slotFillingService.buildSlotFillingContext(chatHistory);
        
        // Merge new entities into current slots
        if (entities.brand) currentSlots.brand = entities.brand;
        if (entities.budget) currentSlots.budget = entities.budget;
        if (entities.color) currentSlots.color = entities.color;
        if (entities.storage) currentSlots.storage = entities.storage;
        if (entities.features) currentSlots.features = entities.features;
        if (entities.usage) currentSlots.usage = entities.usage;

        // Identify missing slots
        const slotStatus = slotFillingService.identifyMissingSlots(intent.name, currentSlots);

        // If slots are insufficient, ask for missing ones
        if (!slotStatus.isSufficient) {
            const slotFillingResponse = slotFillingService.generateSlotFillingResponse(slotStatus.missingSlots);
            if (slotFillingResponse) {
                return `${slotFillingResponse.question}\n\n_[Slot: ${slotFillingResponse.slot}]`;
            }
        }

        // If slots are sufficient, recommend products
        const products = await recommendProductsByIntent(intent.name, userMessage);
        const slotContext = slotFillingService.formatSlotContext(currentSlots);
        
        let response = formatProductListWithEntities(products, currentSlots);
        if (slotContext) {
            response = `Dựa trên yêu cầu của bạn: ${slotContext}\n\n${response}`;
        }
        return response;
    }

    if (intent.group === 'business') {
        if (intent.name === 'product_info') {
            const info = await productInfoResponse(lowerMessage);
            if (info) return info;
        }
        if (intent.name === 'compare_products') {
            const compareText = await compareProducts(lowerMessage);
            if (compareText) return compareText;
        }
        if (intent.name === 'stock_check') {
            return await stockCheckResponse(userMessage);
        }
        if (intent.name === 'order_tracking') {
            return await orderTrackingResponse(lowerMessage);
        }
        if (intent.name === 'cancel_order') {
            return cancelOrderResponse();
        }
        if (intent.name === 'account_support') {
            return accountSupportResponse();
        }
    }

    const policyAnswer = findPolicyAnswer(lowerMessage);
    if (policyAnswer) return policyAnswer;

    const customerResponse = await customerAssistantResponse(userMessage);
    if (customerResponse) return customerResponse;

    const adminResponse = await getAdminDashboardResponse(lowerMessage);
    if (adminResponse) return adminResponse;

    const productInfo = await productInfoResponse(lowerMessage);
    if (productInfo) return productInfo;

    if (/(liên quan|tương tự|similar|related)/i.test(lowerMessage)) {
        const related = await relatedProducts(lowerMessage);
        if (related) return related;
    }

    if (/(giá|price|sale|khuyến mãi|ưu đãi)/i.test(lowerMessage)) {
        return `Chúng tôi có nhiều phân khúc sản phẩm: bình dân, tầm trung và cao cấp. Hãy cho tôi biết nhu cầu hoặc mức giá bạn muốn để tôi gợi ý chính xác hơn.`;
    }

    if (/(so sánh|compare|vs|với)/i.test(lowerMessage)) {
        const compareText = await compareProducts(lowerMessage);
        if (compareText) return compareText;
    }

    if (/(còn hàng|tồn kho)/i.test(lowerMessage)) {
        return await stockCheckResponse(userMessage);
    }

    const products = await findProductRecommendations(userMessage);
    if (products.length) return formatProductList(products);

    const isProductQuery = /(điện thoại|iphone|samsung|xiaomi|oppo|vivo|realme|smartphone|giá|triệu|tr|pin|camera|game|so sánh|compare|mua|hàng|ưu đãi|khuyến mãi)/i.test(lowerMessage);
    if (isProductQuery || entityService.extractAllEntities(userMessage).price_range) {
        return formatProductList(products);
    }

    return fallbackResponse;
};

const saveMessage = async (userId, sender, message, slots = {}, meta = {}) => {
    let chat = await Chat.findOne({ userId, isActive: true });
    if (!chat) {
        chat = new Chat({ 
            userId, 
            messages: [],
            sessionStartedAt: new Date(),
            lastActivityAt: new Date(),
            sessionResetsAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
        });
    }

    // Check if session needs auto-reset
    const now = new Date();
    if (chat.sessionResetsAt && now > chat.sessionResetsAt) {
        // Auto-reset session
        chat.messages = [];
        chat.slots = {};
        chat.currentIntent = null;
        chat.pendingSlot = null;
        chat.sessionStartedAt = now;
        chat.sessionResetsAt = new Date(now.getTime() + 5 * 60 * 1000);
    }

    chat.messages.push({ 
        sender, 
        message, 
        slots: slots || {},
        timestamp: new Date() 
    });

    // Update global slots if provided
    if (slots && Object.keys(slots).length > 0) {
        Object.assign(chat.slots, slots);
    }

    if (sender === 'user') {
        const userIntent = meta.intentName ? intentService.getIntentByName(meta.intentName) : null;
        if (userIntent && userIntent.group === 'sales') {
            chat.currentIntent = meta.intentName;
        } else if (!chat.pendingSlot) {
            chat.currentIntent = null;
            chat.pendingSlot = null;
        }

        if (chat.pendingSlot && slots && Object.keys(slots).length > 0) {
            if (slots[chat.pendingSlot]) {
                chat.pendingSlot = null;
            }
        }
    }

    if (sender === 'admin') {
        const slotMatch = message.match(/_\[Slot:\s*(.+?)\]/);
        if (slotMatch) {
            chat.pendingSlot = slotMatch[1];
        } else {
            chat.pendingSlot = null;
        }
    }

    chat.lastActivityAt = new Date();
    chat.updatedAt = new Date();
    await chat.save();
    return chat;
};

const resetChatSession = async (userId) => {
    const chat = await Chat.findOne({ userId, isActive: true });
    if (chat) {
        chat.messages = [];
        chat.slots = {};
        chat.sessionConfirmed = true;
        chat.sessionStartedAt = new Date();
        chat.sessionResetsAt = new Date(Date.now() + 5 * 60 * 1000);
        chat.updatedAt = new Date();
        await chat.save();
        return chat;
    }
    return null;
};

const confirmChatSession = async (userId) => {
    const chat = await Chat.findOne({ userId, isActive: true });
    if (chat) {
        chat.sessionConfirmed = true;
        chat.lastActivityAt = new Date();
        chat.sessionResetsAt = new Date(Date.now() + 5 * 60 * 1000); // Extend 5 minutes
        chat.updatedAt = new Date();
        await chat.save();
        return chat;
    }
    return null;
};

const endChatSession = async (userId) => {
    const chat = await Chat.findOne({ userId, isActive: true });
    if (chat) {
        chat.isActive = false;
        chat.sessionConfirmed = false;
        chat.updatedAt = new Date();
        await chat.save();
        return chat;
    }
    return null;
};

const getAllChatsForAdmin = async () => {
    return await Chat.find({ isActive: true }).populate("userId", "name email");
};

module.exports = { 
    getRecommendations, 
    generateChatResponse, 
    generateAdminInsight, 
    saveMessage, 
    getChatHistory, 
    getAllChatsForAdmin,
    resetChatSession,
    confirmChatSession,
    endChatSession,
    buildProductQuery
};

