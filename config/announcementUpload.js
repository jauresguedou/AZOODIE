const cloudinary = require("cloudinary");
const CloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");

require("./cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "azoodie/announcements",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
        transformation: [{ width: 1800, height: 1800, crop: "limit", quality: "auto:good" }],
    },
});

module.exports = multer({
    storage,
    limits: { fileSize: 40 * 1024 * 1024 },
    fileFilter(req, file, callback) {
        const accepted = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ].includes(file.mimetype);
        if (!accepted) {
            const error = new Error("Choisissez une photo JPEG, PNG, WebP ou une vidéo MP4, WebM ou MOV.");
            error.status = 400;
            error.expose = true;
            return callback(error);
        }
        callback(null, true);
    },
});
