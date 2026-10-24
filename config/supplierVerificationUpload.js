const multer = require("multer");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const acceptedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
]);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, os.tmpdir());
    },

    filename(req, file, callback) {
        const randomName = crypto.randomBytes(24).toString("hex");
        callback(null, randomName + path.extname(file.originalname).toLowerCase());
    },
});

const uploadSupplierVerificationDocument = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 3,
    },
    fileFilter(req, file, callback) {
        if (!acceptedMimeTypes.has(file.mimetype)) {
            const error = new Error(
                "Format non autorisé. Choisissez un fichier PDF, JPEG, PNG ou WebP."
            );
            error.status = 400;
            error.expose = true;
            return callback(error);
        }

        callback(null, true);
    },
}).array("documents", 3);

module.exports = uploadSupplierVerificationDocument;
