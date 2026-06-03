const brandPatterns = [
    { name: 'Apple', aliases: ['apple', 'iphone', 'ios'] },
    { name: 'Xiaomi', aliases: ['xiaomi', 'redmi', 'poco', 'mi'] },
    { name: 'Samsung', aliases: ['samsung', 'galaxy', 's24', 's23', 's22', 'note'] },
    { name: 'OPPO', aliases: ['oppo', 'reno', 'find'] },
    { name: 'Vivo', aliases: ['vivo'] },
    { name: 'Realme', aliases: ['realme', 'gt'] },
    { name: 'OnePlus', aliases: ['oneplus'] },
    { name: 'Motorola', aliases: ['motorola', 'moto', 'razr', 'edge'] },
    { name: 'Nokia', aliases: ['nokia'] },
    { name: 'TCL', aliases: ['tcl'] },
    { name: 'ZTE', aliases: ['zte', 'axon'] }
];

const colorPatterns = [
    'đen|black|trắng|white|xanh|blue|đỏ|red|hồng|pink|vàng|yellow|cam|orange|tím|purple|xám|gray|bạc|silver|vàng đồng|gold|hồng đào|rose gold'
];

const storagePatterns = [
    { regex: /(\d+)(?:\s*)?(?:gb|gig)/i, unit: 'GB' },
    { regex: /(\d+)(?:\s*)?(?:tb|tб)/i, unit: 'TB' }
];

const priceRangePatterns = [
    { pattern: /dưới\s+(\d+)\s*(?:triệu|tr)?/i, operator: '<' },
    { pattern: /trên\s+(\d+)\s*(?:triệu|tr)?/i, operator: '>' },
    { pattern: /từ\s+(\d+)\s*(?:triệu|tr)?\s+đến\s+(\d+)\s*(?:triệu|tr)?/i, operator: 'range' },
    { pattern: /(\d+)\s*(?:triệu|tr)\s*(?:đến|-)?\s*(\d+)?\s*(?:triệu|tr)?/i, operator: 'range' },
    { pattern: /giá\s+(\d+)/i, operator: '=' },
    { pattern: /dưới\s*(\d+)\s*(?:k|k đồng)?/i, operator: '<' }
];

const featurePatterns = [
    { keys: ['pin', 'pin lâu', 'pin trâu', 'pin cao', 'dung lượng pin'], feature: 'long_battery_life' },
    { keys: ['camera', 'chụp', 'zoom', 'macro', 'selfie', 'ảnh đẹp', 'night mode'], feature: 'camera' },
    { keys: ['game', 'gaming', 'fps', 'mượt', 'hiệu năng', 'performance'], feature: 'gaming' },
    { keys: ['nhanh', 'tốc độ', 'processor', 'chip', 'snapdragon', 'performance'], feature: 'performance' },
    { keys: ['mỏng', 'nhẹ', 'gọn nhẹ', 'portable'], feature: 'portable' },
    { keys: ['màn hình', 'display', 'amoled', '120hz', 'refresh rate'], feature: 'display' },
    { keys: ['pin nhanh', 'sạc nhanh', 'fast charge', '65w', '100w'], feature: 'fast_charging' },
    { keys: [' 5g', 'wifi 6', 'connectivity'], feature: 'connectivity' },
    { keys: ['ngoài trời', 'nước', 'chống nước', 'waterproof', 'ip67', 'ip68'], feature: 'durability' },
    { keys: ['giá rẻ', 'bình dân', 'tiết kiệm', 'rẻ'], feature: 'budget' }
];

const usagePatterns = [
    { keys: ['game', 'chơi game', 'gaming', 'fps', 'pubg', 'liên quân'], usage: 'gaming' },
    { keys: ['công việc', 'office', 'văn phòng', 'email', 'excel', 'zoom'], usage: 'office' },
    { keys: ['chụp', 'camera', 'tiktok', 'instagram', 'content', 'sáng tạo', 'creator'], usage: 'content_creation' },
    { keys: ['học', 'sinh viên', 'đọc sách', 'video', 'streaming'], usage: 'student' },
    { keys: ['lái xe', 'gps', 'điều hướng', 'bản đồ'], usage: 'navigation' },
    { keys: ['nghe nhạc', 'âm nhạc', 'speaker', 'âm thanh'], usage: 'music' },
    { keys: ['xem phim', 'netflix', 'youtube', 'video'], usage: 'entertainment' }
];

const orderIdPattern = /(?:mã đơn|đơn hàng|order id|#)\s*:?\s*([a-zA-Z0-9\-_]+)/i;

const normalizePrice = (value) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return null;
    return num * 1000000;
};

const extractBrand = (text) => {
    const lower = text.toLowerCase();
    for (const brand of brandPatterns) {
        for (const alias of brand.aliases) {
            const regex = new RegExp(`\\b${alias}\\b`, 'i');
            if (regex.test(lower)) {
                return brand.name;
            }
        }
    }
    return null;
};

const extractColor = (text) => {
    const colorRegex = new RegExp(colorPatterns[0], 'i');
    const match = text.match(colorRegex);
    return match ? match[0] : null;
};

const extractStorage = (text) => {
    for (const pattern of storagePatterns) {
        const match = text.match(pattern.regex);
        if (match) {
            return {
                value: parseInt(match[1], 10),
                unit: pattern.unit
            };
        }
    }
    return null;
};

const extractPriceRange = (text) => {
    for (const pricePattern of priceRangePatterns) {
        const match = text.match(pricePattern.pattern);
        if (match) {
            if (pricePattern.operator === 'range' && match[2]) {
                return {
                    operator: 'range',
                    min: normalizePrice(match[1]),
                    max: normalizePrice(match[2])
                };
            } else if (pricePattern.operator === '<') {
                return {
                    operator: '<',
                    value: normalizePrice(match[1])
                };
            } else if (pricePattern.operator === '>') {
                return {
                    operator: '>',
                    value: normalizePrice(match[1])
                };
            } else if (pricePattern.operator === '=') {
                return {
                    operator: '=',
                    value: normalizePrice(match[1])
                };
            }
        }
    }
    return null;
};

const extractFeatures = (text) => {
    const lower = text.toLowerCase();
    const features = [];

    for (const featurePattern of featurePatterns) {
        for (const key of featurePattern.keys) {
            if (lower.includes(key.toLowerCase())) {
                if (!features.includes(featurePattern.feature)) {
                    features.push(featurePattern.feature);
                }
                break;
            }
        }
    }

    return features.length > 0 ? features : null;
};

const extractUsage = (text) => {
    const lower = text.toLowerCase();

    for (const usagePattern of usagePatterns) {
        for (const key of usagePattern.keys) {
            if (lower.includes(key.toLowerCase())) {
                return usagePattern.usage;
            }
        }
    }

    return null;
};

const extractOrderId = (text) => {
    // Try multiple patterns
    const patterns = [
        /mã\s+đơn\s+(?:hàng)?\s*:?\s*#?\s*([a-zA-Z0-9\-_]+)/i,
        /đơn\s+hàng\s*:?\s*#?\s*([a-zA-Z0-9\-_]+)/i,
        /order\s*(?:id|number)?\s*:?\s*#?\s*([a-zA-Z0-9\-_]+)/i,
        /#\s*([a-zA-Z0-9\-_]+)/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

const extractProductName = (text) => {
    const phoneModels = /(?:iphone|galaxy|redmi|poco|reno|find|oppo a|vivo|realme|oneplus|pixel|nexus)(?:\s*\d+)?(?:\s*pro|max|ultra|plus)?/i;
    const match = text.match(phoneModels);
    return match ? match[0].trim() : null;
};

const extractAllEntities = (text) => {
    return {
        brand: extractBrand(text),
        color: extractColor(text),
        storage: extractStorage(text),
        price_range: extractPriceRange(text),
        features: extractFeatures(text),
        usage: extractUsage(text),
        order_id: extractOrderId(text),
        product_name: extractProductName(text)
    };
};

const extractEntitiesByIntent = (text, intentName) => {
    const allEntities = extractAllEntities(text);

    if (intentName && intentName.startsWith('recommend_')) {
        const recommended = {};

        if (allEntities.brand) recommended.brand = allEntities.brand;
        if (allEntities.price_range) recommended.budget = allEntities.price_range;
        if (allEntities.storage) recommended.storage = allEntities.storage;
        if (allEntities.color) recommended.color = allEntities.color;
        if (allEntities.features) recommended.features = allEntities.features;
        if (allEntities.usage) recommended.usage = allEntities.usage;

        return recommended;
    }

    if (intentName === 'order_tracking' && allEntities.order_id) {
        return { order_id: allEntities.order_id };
    }

    return allEntities;
};

module.exports = {
    extractBrand,
    extractColor,
    extractStorage,
    extractPriceRange,
    extractFeatures,
    extractUsage,
    extractOrderId,
    extractProductName,
    extractAllEntities,
    extractEntitiesByIntent
};
