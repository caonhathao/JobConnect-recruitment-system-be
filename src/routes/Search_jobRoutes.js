const express = require('express');
const router = express.Router();

const searchJobController = require('../controllers/Search_jobController');

// Get api/search-jobs
router.get('/search-jobs', searchJobController.searchJobs);

// Export router
module.exports = router;
