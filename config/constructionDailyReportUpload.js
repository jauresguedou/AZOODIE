const multer = require("multer");
const CloudinaryStorage = require("multer-storage-cloudinary");

// Initialise la configuration Cloudinary déjà utilisée par AZÔÔDIÉ.
require("./cloudinary");

const cloudinaryRoot = require("cloudinary");
const cloudinary = cloudinaryRoot.v2;
const cleanupCloudinaryMedia = require("../utils/cloudinaryMediaCleanup");

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const imageMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const videoMimeTypes = new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
]);

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryRoot,
    params: {
        folder: "azoodie/construction-reports",
        resource_type: "auto",
        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "mp4",
            "webm",
            "mov",
        ],
    },
});

// Let Multer clean up partially uploaded files on upload errors.
storage._removeFile = function (req, file, callback) {
    const files = {
        [file.fieldname]: [file],
    };

    cleanupCloudinaryMedia(files, cloudinary)
        .then(() => callback(null))
        .catch(callback);
};

const uploadConstructionReportMedia = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 13,
    },
    fileFilter(req, file, callback) {
        if (
            file.fieldname === "photos" &&
            imageMimeTypes.has(file.mimetype)
        ) {
            return callback(null, true);
        }

        if (
            file.fieldname === "videos" &&
            videoMimeTypes.has(file.mimetype)
        ) {
            return callback(null, true);
        }

        const error = new Error(
            "Format non autorisé. Photos : JPEG, PNG ou WebP. " +
            "Vidéos : MP4, WebM ou MOV."
        );

        error.status = 400;
        error.expose = true;

        return callback(error);
    },
}).fields([
    {
        name: "photos",
        maxCount: 10,
    },
    {
        name: "videos",
        maxCount: 3,
    },
]);

uploadConstructionReportMedia.storage = storage;

module.exports = uploadConstructionReportMedia;
