"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToServiceRequest = exports.getProfessionalServiceRequests = exports.submitServiceRequest = exports.uploadMiddleware = void 0;
const ServiceRequest_1 = require("../models/ServiceRequest");
const User_1 = require("../models/User");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/service-requests';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});
exports.uploadMiddleware = upload.single('attachedFile');
const submitServiceRequest = async (req, res) => {
    try {
        console.log('=== Service request submission started ===');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('User:', req.user);
        const { serviceType, projectDescription, professionalId } = req.body;
        const clientId = req.user?.id;
        console.log('Extracted data:', { serviceType, projectDescription, professionalId, clientId });
        if (!clientId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!serviceType || !projectDescription || !professionalId) {
            return res.status(400).json({
                success: false,
                message: 'Service type, project description, and professional ID are required'
            });
        }
        const professional = await User_1.User.findById(professionalId);
        if (!professional) {
            return res.status(404).json({
                success: false,
                message: 'Professional not found'
            });
        }
        if (professional.role !== 'professional' && professional.role !== 'expert') {
            return res.status(400).json({
                success: false,
                message: 'User is not a professional or expert'
            });
        }
        const serviceRequest = new ServiceRequest_1.ServiceRequest({
            client: clientId,
            provider: professionalId,
            service: serviceType.trim(),
            description: projectDescription.trim(),
            attachments: req.file ? [req.file.path] : undefined,
            status: 'pending'
        });
        console.log('Service request before save:', serviceRequest);
        await serviceRequest.save();
        console.log('Service request after save:', serviceRequest);
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${professionalId}`).emit('service_request_notification', {
                senderId: clientId,
                serviceRequestId: serviceRequest._id,
                serviceType: serviceType,
                description: projectDescription,
                clientName: req.user?.name || req.user?.email || 'عميل',
                status: 'pending',
                message: `طلب خدمة جديد: ${serviceType}`,
                timestamp: new Date(),
            });
            console.log(`Real-time notification sent to professional ${professionalId}`);
        }
        console.log(`Service request submitted by client ${clientId} to professional ${professionalId}`);
        res.status(201).json({
            success: true,
            message: 'Service request submitted successfully',
            data: {
                requestId: serviceRequest._id,
                status: serviceRequest.status
            }
        });
    }
    catch (error) {
        console.error('=== Error submitting service request ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.submitServiceRequest = submitServiceRequest;
const getProfessionalServiceRequests = async (req, res) => {
    try {
        const professionalId = req.user?.id || req.user?._id;
        console.log('=== Getting professional service requests ===');
        console.log('User object:', req.user);
        console.log('Professional ID:', professionalId);
        if (!professionalId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const allRequests = await ServiceRequest_1.ServiceRequest.find({});
        console.log('Total service requests in database:', allRequests.length);
        console.log('All service requests:', allRequests.map(req => ({
            id: req._id,
            provider: req.provider,
            client: req.client,
            service: req.service,
            status: req.status
        })));
        console.log('Searching for service requests with provider:', professionalId);
        const requests = await ServiceRequest_1.ServiceRequest.find({ provider: professionalId })
            .populate('client', 'name email phone')
            .sort({ createdAt: -1 });
        console.log('Found service requests for professional:', requests.length);
        console.log('Professional service requests:', requests);
        const formattedRequests = requests.map(request => {
            const client = request.client;
            return {
                id: request._id,
                clientId: client._id,
                clientName: client.name,
                serviceType: request.service,
                projectDescription: request.description,
                attachedFile: request.attachments?.[0],
                status: request.status,
                createdAt: request.createdAt
            };
        });
        res.json({
            success: true,
            data: formattedRequests
        });
    }
    catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getProfessionalServiceRequests = getProfessionalServiceRequests;
const respondToServiceRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body;
        const professionalId = req.user?.id;
        if (!professionalId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action must be either "accept" or "reject"'
            });
        }
        const serviceRequest = await ServiceRequest_1.ServiceRequest.findById(requestId);
        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Service request not found'
            });
        }
        if (serviceRequest.provider.toString() !== professionalId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to respond to this request'
            });
        }
        if (serviceRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been responded to'
            });
        }
        serviceRequest.status = action === 'accept' ? 'accepted' : 'cancelled';
        await serviceRequest.save();
        res.json({
            success: true,
            message: `Service request ${action}ed successfully`,
            data: {
                requestId: serviceRequest._id,
                status: serviceRequest.status
            }
        });
    }
    catch (error) {
        console.error('Error responding to service request:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.respondToServiceRequest = respondToServiceRequest;
//# sourceMappingURL=serviceRequestController.js.map