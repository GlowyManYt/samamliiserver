"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const serviceRequestController_1 = require("../controllers/serviceRequestController");
const router = express_1.default.Router();
router.post('/', auth_1.authenticate, serviceRequestController_1.uploadMiddleware, serviceRequestController_1.submitServiceRequest);
router.get('/professional', auth_1.authenticate, serviceRequestController_1.getProfessionalServiceRequests);
router.patch('/:requestId/respond', auth_1.authenticate, serviceRequestController_1.respondToServiceRequest);
exports.default = router;
//# sourceMappingURL=serviceRequestRoutes.js.map