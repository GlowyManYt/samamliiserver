import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  submitServiceRequest,
  getProfessionalServiceRequests,
  respondToServiceRequest,
  uploadMiddleware
} from '../controllers/serviceRequestController';

const router = express.Router();

// Submit a new service request (clients only)
router.post('/', authenticate, uploadMiddleware, submitServiceRequest);

// Get service requests for a professional
router.get('/professional', authenticate, getProfessionalServiceRequests);

// Respond to a service request (accept/reject)
router.patch('/:requestId/respond', authenticate, respondToServiceRequest);

export default router;
