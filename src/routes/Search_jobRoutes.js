const express = require('express');
const router = express.Router();

const searchJobController = require('../controllers/Search_jobController');

// GET /api/search-jobs  (mounted at /api/search-jobs in server.js)
router.get('/', searchJobController.searchJobs);


// Export router
module.exports = router;
