const cloudinary = require("cloudinary").v2;

/**
 * Supprime uniquement les documents Cloudinary transmis à cette soumission.
 * Les ressources sont stockées avec le type authenticated.
 */
async function cleanupSupplierVerificationAssets(
    files = [],
    logger = console
) {
    const assets = files.filter(
        (file) =>
            typeof file?.public_id === "string" &&
            file.public_id.startsWith(
                "azoodie/supplier-verification/"
            ) &&
            !file.public_id.includes("..")
    );

    const results = await Promise.allSettled(
        assets.map((asset) =>
            cloudinary.uploader.destroy(asset.public_id, {
                resource_type: "image",
                type: "authenticated",
                invalidate: true,
            })
        )
    );

    for (const result of results) {
        if (result.status === "rejected") {
            logger.error(
                "Échec du nettoyage d'un document de vérification fournisseur."
            );
        }
    }
}

module.exports = cleanupSupplierVerificationAssets;
