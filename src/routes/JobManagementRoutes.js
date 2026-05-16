const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");
const JobManagementController = require("../controllers/JobManagementController");

router.use(protect);
router.use(authorize(ROLES.RECRUITER));

router.post("/", JobManagementController.createJob);
router.get("/", JobManagementController.getMyJobs);
router.get("/:id", JobManagementController.getJobDetail);
router.put("/:id", JobManagementController.updateJob);
router.patch("/:id/toggle-pause", JobManagementController.togglePauseJob);
router.delete("/:id", JobManagementController.deleteJob);

module.exports = router;
