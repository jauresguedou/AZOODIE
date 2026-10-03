const cloudinaryRoot = require("cloudinary");
const CloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryRoot,
    params: {
        folder: "azoodie/portfolio",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }],
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 40 * 1024 * 1024 },
    fileFilter(req, file, callback) {
        const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
        const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(file.mimetype);
        if (!isImage && !isVideo) {
            const error = new Error("Format non pris en charge. Choisissez une image JPEG, PNG, WebP ou une vidéo MP4, WebM ou MOV.");
            error.status = 400;
            error.expose = true;
            return callback(error);
        }
        callback(null, true);
    },
});

module.exports = upload;
