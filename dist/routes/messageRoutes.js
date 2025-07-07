"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const messageController_1 = require("../controllers/messageController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/', messageController_1.sendMessage);
router.get('/conversations', messageController_1.getConversations);
router.get('/conversation/:otherUserId', messageController_1.getConversation);
router.patch('/mark-read', messageController_1.markAsRead);
router.get('/unread-count', messageController_1.getUnreadCount);
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map