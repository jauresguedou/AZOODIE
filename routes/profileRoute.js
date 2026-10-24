
const express = require("express");
const router = express.Router();

const {
    showMyProfile,
    uploadMyPhoto,
    uploadSupplierLogo
} = require("../controllers/clientController");

const {
    requireLogin,
    requireSupplierRole
} = require("../middleware/auth");

const { upload } = require("../config/cloudinary");

const {
    uploadSupplierProfilePhoto,
    uploadSupplierLogo: uploadSupplierLogoFile
} = require("../config/supplierProfileUploads");

router.get("/", requireLogin, showMyProfile);

// Route existante : conservée pour les autres profils.
router.post("/photo", requireLogin, upload.single("photo"), uploadMyPhoto);

// Nouvelles routes réservées aux fournisseurs.
router.post(
    "/supplier-photo",
    requireLogin,
    requireSupplierRole,
    uploadSupplierProfilePhoto.single("photo"),
    uploadMyPhoto
);

router.post(
    "/supplier-logo",
    requireLogin,
    requireSupplierRole,
    uploadSupplierLogoFile.single("logo"),
    uploadSupplierLogo
);

module.exports = router;
