const express = require("express");
const router = express.Router();

const {
    requireLogin,
    requireSupplierRole
} = require("../middleware/auth");

const {
    showDashboard,
    showRegistrationForm,
    registerSupplier,
    showVerificationForm,
    ensureCanSubmitVerification,
    submitSupplierVerification
} = require("../controllers/supplierController");

const handleSupplierVerificationUpload = require(
    "../middleware/supplierVerificationUpload"
);

const validateAndUploadSupplierVerificationDocuments = require(
    "../middleware/validateAndUploadSupplierVerificationDocuments"
);

const {
    ensureSupplierVerificationCsrfToken,
    verifySupplierVerificationCsrf
} = require("../middleware/supplierVerificationCsrf");

const {
    showOfferForm,
    publishOffer,
    showSupplierOffers
} = require("../controllers/supplierOfferController");

router.get(
    "/register",
    requireLogin,
    requireSupplierRole,
    showRegistrationForm
);

router.post(
    "/register",
    requireLogin,
    requireSupplierRole,
    registerSupplier
);

router.get(
    "/dashboard",
    requireLogin,
    requireSupplierRole,
    showDashboard
);

router.get(
    "/verification",
    requireLogin,
    requireSupplierRole,
    ensureSupplierVerificationCsrfToken,
    showVerificationForm
);

router.post(
    "/verification",
    requireLogin,
    requireSupplierRole,
    verifySupplierVerificationCsrf,
    ensureCanSubmitVerification,
    handleSupplierVerificationUpload,
    validateAndUploadSupplierVerificationDocuments,
    submitSupplierVerification
);

router.get(
    "/offers/new",
    requireLogin,
    requireSupplierRole,
    showOfferForm
);

router.post(
    "/offers",
    requireLogin,
    requireSupplierRole,
    publishOffer
);

router.get(
    "/offers",
    requireLogin,
    requireSupplierRole,
    showSupplierOffers
);

module.exports = router;
