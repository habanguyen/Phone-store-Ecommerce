const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authMiddleware, adminOrStaffMiddleware } = require("../middlewares/auth.middleware");

console.log('ai.routes.js loaded');
// debug: list all routes registered on this router
try {
	const routes = router.stack
		.filter((layer) => layer.route)
		.map((layer) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
	console.log('ai.routes routes:', routes);
} catch (e) {
	console.error('Error listing ai.routes routes', e);
}

router.get("/recommendations", aiController.getRecommendations);
router.post("/chat/guest", aiController.sendMessageGuest);
router.get("/chat/guest", aiController.getChatHistoryGuest);
// allow guest access when no Authorization header is present by delegating to guest handlers
router.post("/chat", (req, res, next) => {
	if (!req.headers || !req.headers.authorization) return aiController.sendMessageGuest(req, res);
	next();
}, authMiddleware, aiController.sendMessage);

router.get("/chat", (req, res, next) => {
	if (!req.headers || !req.headers.authorization) return aiController.getChatHistoryGuest(req, res);
	next();
}, authMiddleware, aiController.getChatHistory);
router.get("/admin/chats", authMiddleware, adminOrStaffMiddleware, aiController.getAllChats);
router.post("/admin/reply", authMiddleware, adminOrStaffMiddleware, aiController.replyToChat);
router.get("/admin/insight", authMiddleware, adminOrStaffMiddleware, aiController.generateAdminInsight);

// Session management routes
router.post("/session/reset", authMiddleware, aiController.resetSession);
router.post("/session/confirm", authMiddleware, aiController.confirmSession);
router.post("/session/end", authMiddleware, aiController.endSession);

// debug: list all routes registered on this router
try {
	const routes = router.stack
		.filter((layer) => layer.route)
		.map((layer) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
	console.log('ai.routes routes:', routes);
} catch (e) {
	console.error('Error listing ai.routes routes', e);
}

module.exports = router;
