const express = require('express');
const router = express.Router();

const publicController = require('../controllers/PublicController');



// Xem chi tiết công việc (Public)


// GET /api/public/jobs/:id
router.get('/jobs/:id', publicController.getJobDetail);
// Xem chi tiết công ty (Public)
// GET /api/public/companies/:id    
router.get('/companies/:id', publicController.getCompanyDetail);

// Export router
module.exports = router;
