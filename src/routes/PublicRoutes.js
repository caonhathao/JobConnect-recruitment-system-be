const express = require('express');
const router = express.Router();

const publicController = require('../controllers/PublicController');

// Xem chi tiết công việc (Public)
router.get('/jobs/:id', publicController.getJobDetail);
// Xem chi tiết công ty (Public)
router.get('/companies/:id', publicController.getCompanyDetail);

// Export router
module.exports = router;
