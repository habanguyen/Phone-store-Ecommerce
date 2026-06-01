const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/user.controller");
const { authMiddleware, adminMiddleware } = require("../../middlewares/auth.middleware");

router.use(authMiddleware, adminMiddleware);
router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.put("/:id/status", userController.updateUserStatus);
router.delete("/:id", userController.deleteUser);

module.exports = router;
