/**
 * Remove uploaded Cloudinary media using the correct resource type.
 * The Cloudinary client is injected so the helper can be tested safely.
 */
async function cleanupCloudinaryMedia(
    files = {},
    cloudinary,
    logger = console
) {
    const items = [
        ...(files.photos || []).map((file) => ({
            file,
            resourceType: "image",
        })),
        ...(files.videos || []).map((file) => ({
            file,
            resourceType: "video",
        })),
    ];

    const results = await Promise.allSettled(
        items.map(({ file, resourceType }) => {
            const publicId = file.public_id || file.filename;

            if (!publicId) {
                return Promise.resolve();
            }

            return cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true,
            });
        })
    );

    for (const result of results) {
        if (result.status === "rejected") {
            logger.error(
                "Échec du nettoyage d'un média Cloudinary :",
                result.reason
            );
        }
    }
}

module.exports = cleanupCloudinaryMedia;
