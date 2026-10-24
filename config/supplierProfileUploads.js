
require("./cloudinary");

const cloudinary = require("cloudinary");
const CloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");

const imageFormats = ["jpg", "jpeg", "png", "webp"];

const profilePhotoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "azoodie/supplier-profiles",
        allowed_formats: imageFormats,
        transformation: [
            { width: 600, height: 600, crop: "limit" }
        ]
    }
});

const supplierLogoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "azoodie/supplier-logos",
        allowed_formats: imageFormats,
        transformation: [
            { width: 1200, height: 400, crop: "limit" }
        ]
    }
});

const uploadLimits = {
    fileSize: 5 * 1024 * 1024
};

const uploadSupplierProfilePhoto = multer({
    storage: profilePhotoStorage,
    limits: uploadLimits
});

const uploadSupplierLogo = multer({
    storage: supplierLogoStorage,
    limits: uploadLimits
});

module.exports = {
    uploadSupplierProfilePhoto,
    uploadSupplierLogo
};
