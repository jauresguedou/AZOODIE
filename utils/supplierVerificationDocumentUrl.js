require("../config/cloudinary");

const cloudinary = require("cloudinary").v2;

const ALLOWED_FOLDER = "azoodie/supplier-verification";
const LINK_LIFETIME_SECONDS = 5 * 60;

const ALLOWED_FORMATS = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "pdf",
]);

function createSupplierVerificationDocumentUrl({ publicId, format }) {
    if (
        typeof publicId !== "string" ||
        !publicId.startsWith(`${ALLOWED_FOLDER}/`) ||
        publicId.includes("..")
    ) {
        throw new Error("Identifiant de document de vérification invalide.");
    }

    if (
        typeof format !== "string" ||
        !ALLOWED_FORMATS.has(format.toLowerCase())
    ) {
        throw new Error("Format de document de vérification invalide.");
    }

    if (
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET ||
        !process.env.CLOUDINARY_CLOUD_NAME
    ) {
        throw new Error("La configuration Cloudinary est incomplète.");
    }

    const expiresAt =
        Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS;

    return cloudinary.utils.private_download_url(
        publicId,
        format.toLowerCase(),
        {
            resource_type: "image",
            type: "authenticated",
            expires_at: expiresAt,
            attachment: true,
        }
    );
}

module.exports = { createSupplierVerificationDocumentUrl };
