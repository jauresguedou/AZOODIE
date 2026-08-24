const express = require("express");
const router = express.Router();

const { showCoverageDashboard} = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

router.get("/coverage", requireAdmin, showCoverageDashboard);

module.exports = router;