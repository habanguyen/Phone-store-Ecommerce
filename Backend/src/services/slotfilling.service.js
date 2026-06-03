// Slot Filling Service - Quản lý các slots (khung dữ liệu) cần thiết để hoàn thiện khuyến nghị

const REQUIRED_SLOTS_BY_INTENT = {
    recommend_gaming: ['budget', 'brand'],
    recommend_camera: ['budget', 'brand'],
    recommend_battery: ['budget', 'brand'],
    recommend_student: ['budget'],
    recommend_flagship: [],
    recommend_office: ['budget'],
    recommend_creator: ['budget'],
    recommend_ios: ['budget'],
    recommend_android: ['budget'],
    recommend_compact: ['budget']
};

const SLOT_QUESTIONS = {
    budget: {
        question: 'Bạn muốn khoảng giá bao nhiêu để mình gợi ý chính xác hơn? (vd: dưới 10 triệu, 15-20 triệu)',
        aliases: ['price', 'price_range', 'price_budget']
    },
    brand: {
        question: 'Bạn ưa thích hãng nào? (vd: Samsung, iPhone, Xiaomi, OPPO, Vivo)',
        aliases: ['brand_preference', 'manufacturer']
    },
    color: {
        question: 'Bạn thích màu gì? (vd: đen, trắng, xanh, hồng)',
        aliases: ['color_preference', 'device_color']
    },
    storage: {
        question: 'Bạn cần dung lượng bao nhiêu? (vd: 128GB, 256GB, 512GB)',
        aliases: ['storage_capacity', 'memory']
    },
    features: {
        question: 'Bạn quan tâm đến tính năng nào? (vd: pin lâu, camera tốt, hiệu năng mạnh)',
        aliases: ['feature_preference', 'must_have_features']
    },
    usage: {
        question: 'Bạn sử dụng chủ yếu để làm gì? (vd: chơi game, công việc, chụp ảnh)',
        aliases: ['primary_use', 'use_case']
    }
};

const PRIORITY_SLOTS = {
    recommend_gaming: ['budget', 'brand'],
    recommend_camera: ['budget', 'brand'],
    recommend_battery: ['budget'],
    recommend_student: ['budget'],
    recommend_flagship: ['brand'],
    recommend_office: ['budget'],
    recommend_creator: ['budget'],
    recommend_ios: ['budget'],
    recommend_android: ['budget'],
    recommend_compact: ['budget']
};

const extractedEntityToSlot = (entity) => {
    const mapping = {
        brand: 'brand',
        price_range: 'budget',
        storage: 'storage',
        color: 'color',
        features: 'features',
        usage: 'usage'
    };
    return mapping[entity] || null;
};

const identifyMissingSlots = (intentName, extractedEntities = {}) => {
    const requiredSlots = REQUIRED_SLOTS_BY_INTENT[intentName] || [];
    const filledSlots = {};

    // Map extracted entities to slots
    Object.entries(extractedEntities).forEach(([entity, value]) => {
        if (value !== null && value !== undefined) {
            const slot = extractedEntityToSlot(entity);
            if (slot) {
                filledSlots[slot] = value;
            }
        }
    });

    // Tìm slots bị thiếu
    const missingSlots = requiredSlots.filter((slot) => !filledSlots[slot]);

    return {
        filledSlots,
        missingSlots,
        isSufficient: missingSlots.length === 0
    };
};

const generateSlotQuestion = (slot) => {
    if (!SLOT_QUESTIONS[slot]) {
        return null;
    }
    return SLOT_QUESTIONS[slot].question;
};

const generateSlotFillingResponse = (missingSlots) => {
    if (!missingSlots || missingSlots.length === 0) {
        return null;
    }

    // Lấy slot đầu tiên và hỏi về nó
    const nextSlot = missingSlots[0];
    const question = generateSlotQuestion(nextSlot);

    if (!question) {
        return null;
    }

    return {
        slot: nextSlot,
        question,
        type: 'slot_filling'
    };
};

const validateSlotValue = (slot, value) => {
    if (!value) return false;

    switch (slot) {
        case 'budget':
            // Kiểm tra xem có chứa số không
            return /\d+/.test(value);
        case 'brand':
            // Kiểm tra xem brand có hợp lệ không
            const brands = ['apple', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'oneplus', 'motorola', 'nokia', 'zte'];
            return brands.some((brand) => value.toLowerCase().includes(brand));
        case 'color':
            const colors = ['đen', 'trắng', 'xanh', 'đỏ', 'hồng', 'vàng', 'cam', 'tím', 'xám', 'bạc', 'gold', 'rose'];
            return colors.some((color) => value.toLowerCase().includes(color));
        case 'storage':
            return /\d+\s*(?:gb|tb)/i.test(value);
        default:
            return true;
    }
};

const buildSlotFillingContext = (chatHistory = []) => {
    const slotContext = {
        budget: null,
        brand: null,
        color: null,
        storage: null,
        features: [],
        usage: null
    };

    // Duyệt qua lịch sử chat để trích xuất slot
    if (Array.isArray(chatHistory)) {
        chatHistory.forEach((entry) => {
            if (entry.slots) {
                Object.assign(slotContext, entry.slots);
            }
        });
    }

    return slotContext;
};

const shouldAskMoreSlots = (intentName, currentSlots = {}, minimalRequirement = 0.7) => {
    const requiredSlots = REQUIRED_SLOTS_BY_INTENT[intentName] || [];
    if (requiredSlots.length === 0) return false;

    const filledCount = requiredSlots.filter((slot) => currentSlots[slot]).length;
    const fillPercentage = filledCount / requiredSlots.length;

    return fillPercentage < minimalRequirement;
};

const formatSlotContext = (slots) => {
    const parts = [];

    if (slots.brand) {
        parts.push(`Hãng: ${slots.brand}`);
    }
    if (slots.budget) {
        if (typeof slots.budget === 'object') {
            if (slots.budget.operator === '<') {
                parts.push(`Giá: dưới ${slots.budget.value / 1000000}tr`);
            } else if (slots.budget.operator === '>') {
                parts.push(`Giá: trên ${slots.budget.value / 1000000}tr`);
            } else if (slots.budget.operator === 'range') {
                parts.push(`Giá: ${slots.budget.min / 1000000}tr - ${slots.budget.max / 1000000}tr`);
            }
        } else {
            parts.push(`Giá: ${slots.budget}`);
        }
    }
    if (slots.color) {
        parts.push(`Màu: ${slots.color}`);
    }
    if (slots.storage) {
        parts.push(`Dung lượng: ${slots.storage.value}${slots.storage.unit}`);
    }
    if (slots.features && slots.features.length > 0) {
        parts.push(`Tính năng: ${slots.features.join(', ')}`);
    }
    if (slots.usage) {
        parts.push(`Sử dụng: ${slots.usage}`);
    }

    return parts.join(' | ');
};

const clarifySlots = (intentName, userResponse, existingSlots = {}) => {
    // Parse user response to extract slot values
    const response = userResponse.toLowerCase();

    const updatedSlots = { ...existingSlots };

    // Thử nhận dạng budget từ user response
    if (response.includes('triệu') || /\d+/.test(response)) {
        const match = response.match(/(\d+)\s*(?:triệu|tr)?/);
        if (match) {
            updatedSlots.budget = {
                operator: '<',
                value: parseInt(match[1]) * 1000000
            };
        }
    }

    // Thử nhận dạng brand
    const brands = ['apple', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'oneplus'];
    for (const brand of brands) {
        if (response.includes(brand)) {
            updatedSlots.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
            break;
        }
    }

    // Thử nhận dạng color
    const colors = {
        'đen': 'đen',
        'trắng': 'trắng',
        'xanh': 'xanh',
        'đỏ': 'đỏ',
        'hồng': 'hồng',
        'vàng': 'vàng'
    };
    for (const [colorKey, colorValue] of Object.entries(colors)) {
        if (response.includes(colorKey)) {
            updatedSlots.color = colorValue;
            break;
        }
    }

    return updatedSlots;
};

module.exports = {
    identifyMissingSlots,
    generateSlotQuestion,
    generateSlotFillingResponse,
    validateSlotValue,
    buildSlotFillingContext,
    shouldAskMoreSlots,
    formatSlotContext,
    clarifySlots,
    SLOT_QUESTIONS,
    REQUIRED_SLOTS_BY_INTENT,
    PRIORITY_SLOTS
};
