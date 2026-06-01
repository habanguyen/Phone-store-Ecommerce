const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/contact.controller');
const { authMiddleware, adminOrStaffMiddleware } = require('../../middlewares/auth.middleware');

router.use(authMiddleware, adminOrStaffMiddleware);
router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.put('/:id/status', contactController.updateContactStatus);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
