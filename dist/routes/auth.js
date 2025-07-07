"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
router.post('/register', validation_1.userValidation.register, authController_1.register);
router.post('/login', validation_1.userValidation.login, authController_1.login);
router.post('/refresh', authController_1.refreshToken);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/profile', auth_1.authenticate, validation_1.userValidation.updateProfile, authController_1.updateProfile);
router.put('/change-password', auth_1.authenticate, validation_1.userValidation.changePassword, authController_1.changePassword);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.put('/deactivate', auth_1.authenticate, authController_1.deactivateAccount);
router.get('/verify', auth_1.authenticate, authController_1.verifyToken);
exports.default = router;
//# sourceMappingURL=auth.js.map