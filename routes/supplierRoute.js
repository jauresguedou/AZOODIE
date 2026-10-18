
const express = require("express");
const router = express.Router();

const {
    requireLogin,
    requireSupplierRole
} = require("../middleware/auth");

const {
    showDashboard,
    showRegistrationForm,
    registerSupplier
} = require("../controllers/supplierController");

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
