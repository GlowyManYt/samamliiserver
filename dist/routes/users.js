"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', userController_1.userController.getUsers.bind(userController_1.userController));
router.get('/:id', userController_1.userController.getUserById.bind(userController_1.userController));
router.put('/profile', auth_1.authenticate, userController_1.userController.updateProfile.bind(userController_1.userController));
exports.default = router;
//# sourceMappingURL=users.js.map