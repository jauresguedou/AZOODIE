const express = require("express");
const router = express.Router();

const {
    showAdminDashboard,
    showCoverageDashboard,
    showSupplierVerifications,
    reviewSupplierVerification,
    showSupplierVerificationDocument,
} = require("../controllers/adminController");

const { requireAdmin } = require("../middleware/auth");

const {
    ensureAdminSupplierVerificationCsrfToken,
    verifyAdminSupplierVerificationCsrf,
} = require("../middleware/adminSupplierVerificationCsrf");
router.get("/", requireAdmin, showAdminDashboard);
router.get("/coverage", requireAdmin, showCoverageDashboard);

router.get(
    "/supplier-verifications",
    requireAdmin,
    ensureAdminSupplierVerificationCsrfToken,
    showSupplierVerifications
);

router.post(
    "/supplier-verifications/:id/review",
    requireAdmin,
    verifyAdminSupplierVerificationCsrf,
    reviewSupplierVerification
);

router.get(
    "/supplier-verifications/:id/documents/:documentId",
    requireAdmin,
    showSupplierVerificationDocument
);

module.exports = router;
