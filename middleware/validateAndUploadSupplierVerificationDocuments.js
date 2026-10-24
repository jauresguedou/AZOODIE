const fs = require("fs/promises");
const cloudinary = require("cloudinary").v2;

const {
    detectSupplierVerificationFileType,
} = require("../utils/detectSupplierVerificationFileType");

const {
    readSupplierVerificationFileHeader,
} = require("../utils/readSupplierVerificationFileHeader");

const ALLOWED_FORMATS = new Set(["jpg", "png", "webp", "pdf"]);

function createSafeError(message, status) {
    const error = new Error(message);
    error.status = status;
    error.expose = true;
    return error;
}

async function removeTemporaryFiles(files) {
    await Promise.all(
        files.map(async (file) => {
            if (!file.path) return;

            try {
                await fs.unlink(file.path);
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error(
                        "Impossible de supprimer un fichier temporaire de vérification."
                    );
                }
            }
        })
    );
}

async function destroyUploadedAssets(assets) {
    await Promise.all(
        assets.map(async (asset) => {
            try {
                await cloudinary.uploader.destroy(asset.public_id, {
                    resource_type: "image",
                    type: "authenticated",
                    invalidate: true,
                });
            } catch (error) {
                console.error(
                    "Impossible de supprimer une ressource Cloudinary créée lors d'un téléversement incomplet."
                );
            }
        })
    );
}

async function validateAndUploadSupplierVerificationDocuments(
    req,
    res,
    next
) {
    const files = Array.isArray(req.files) ? req.files : [];
    const uploadedAssets = [];
    let safeError = null;

    try {
        const validatedFiles = [];

        // Valider tous les fichiers avant d'en envoyer un seul.
        for (const file of files) {
            const header = await readSupplierVerificationFileHeader(
                file.path
            );

            let detectedType;

            try {
                detectedType = detectSupplierVerificationFileType(
                    header,
                    file.mimetype
                );
            } catch (error) {
                throw createSafeError(error.message, 400);
            }

            if (!ALLOWED_FORMATS.has(detectedType.format)) {
                throw createSafeError(
                    "Format de document non autorisé.",
                    400
                );
            }

            validatedFiles.push({ file, detectedType });
        }

        // Les signatures sont toutes valides avant le premier envoi.
        for (const { file, detectedType } of validatedFiles) {
            const asset = await cloudinary.uploader.upload(file.path, {
                folder: "azoodie/supplier-verification",
                resource_type: "image",
                type: "authenticated",
                format: detectedType.format,
                allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
            });

            // Enregistrer immédiatement toute ressource identifiable
            // afin de pouvoir la supprimer si la réponse est incomplète.
            if (asset?.public_id) {
                uploadedAssets.push(asset);
            }

            if (!asset?.public_id || !asset?.format) {
                throw new Error("Réponse Cloudinary incomplète.");
            }
        }
    } catch (error) {
        const isClientError = error.status === 400;

        if (!isClientError) {
            console.error(
                "Erreur interne pendant la validation ou l'envoi des documents de vérification."
            );
        }

        safeError = createSafeError(
            isClientError
                ? error.message
                : "Une erreur interne a empêché le téléversement. Réessayez plus tard.",
            isClientError ? 400 : 500
        );
    }

    // Toujours nettoyer les fichiers temporaires avant de continuer.
    await removeTemporaryFiles(files);

    if (safeError) {
        await destroyUploadedAssets(uploadedAssets);

        const accept = typeof req.get === "function"
            ? req.get("Accept")
            : req.headers?.accept;

        if (
            typeof accept === "string" &&
            accept.includes("application/json")
        ) {
            return res.status(safeError.status).json({
                message: safeError.message,
            });
        }

        return next(safeError);
    }

    req.files = uploadedAssets;
    return next();
}

module.exports = validateAndUploadSupplierVerificationDocuments;
