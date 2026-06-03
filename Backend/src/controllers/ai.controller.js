const aiService = require("../services/ai.service");
const entityService = require("../services/entity.service");
const intentService = require("../services/intent.service");
const slotFillingService = require("../services/slotfilling.service");

const getRecommendations = async (req, res) => {
    try {
        const recommendations = await aiService.getRecommendations(req.query);
        res.json({ recommendations });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id; // Assuming auth middleware sets req.user

        // Extract entities from user message
        const entities = entityService.extractAllEntities(message);
        const slots = {};
        
        // Convert entities to slots
        if (entities.brand) slots.brand = entities.brand;
        if (entities.price_range) slots.budget = entities.price_range;
        if (entities.color) slots.color = entities.color;
        if (entities.storage) slots.storage = entities.storage;
        if (entities.features) slots.features = entities.features;
        if (entities.usage) slots.usage = entities.usage;

        const userIntent = intentService.detectIntent(message);

        // Save user message with slots and intent metadata
        await aiService.saveMessage(userId, "user", message, slots, { intentName: userIntent.name });

        // Generate AI response
        const aiResponse = await aiService.generateChatResponse(message, userId);

        // Save AI response
        await aiService.saveMessage(userId, "admin", aiResponse);

        res.json({ response: aiResponse });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const sendMessageGuest = async (req, res) => {
    try {
        const { message } = req.body;
        const aiResponse = await aiService.generateChatResponse(message, null);
        res.json({ response: aiResponse });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const resetSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const chat = await aiService.resetChatSession(userId);
        res.json({ message: "Session reset successful", chat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const confirmSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const chat = await aiService.confirmChatSession(userId);
        res.json({ message: "Session confirmed", chat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const endSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const chat = await aiService.endChatSession(userId);
        res.json({ message: "Session ended", chat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const chat = await aiService.getChatHistory(userId);
        res.json({ chat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getChatHistoryGuest = async (req, res) => {
    try {
        const chat = { messages: [ { sender: 'admin', message: 'Xin chào! Tôi có thể giúp bạn tìm sản phẩm, so sánh, hoặc trả lời chính sách. Đăng nhập sẽ lưu lịch sử.' } ] };
        res.json({ chat });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getAllChats = async (req, res) => {
    try {
        const chats = await aiService.getAllChatsForAdmin();
        res.json({ chats });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const replyToChat = async (req, res) => {
    try {
        const { userId, message } = req.body;
        await aiService.saveMessage(userId, "admin", message);
        res.json({ message: "Reply sent" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const generateAdminInsight = async (req, res) => {
    try {
        const { type, prompt } = req.query;
        const insight = await aiService.generateAdminInsight({ type, prompt });
        res.json({ insight });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { 
    getRecommendations, 
    sendMessage, 
    getChatHistory, 
    getAllChats, 
    replyToChat, 
    generateAdminInsight, 
    sendMessageGuest, 
    getChatHistoryGuest,
    resetSession,
    confirmSession,
    endSession
};