const cleanupCloudinaryMedia = require("../utils/cloudinaryMediaCleanup");

describe("cleanupCloudinaryMedia", () => {
    let cloudinary;
    let logger;

    beforeEach(() => {
        cloudinary = {
            uploader: {
                destroy: jest.fn().mockResolvedValue({ result: "ok" }),
            },
        };

        logger = {
            error: jest.fn(),
        };
    });

    test("supprime les photos comme des ressources image", async () => {
        await cleanupCloudinaryMedia(
            {
                photos: [{ public_id: "azoodie/construction-reports/photo-1" }],
            },
            cloudinary,
            logger
        );

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            "azoodie/construction-reports/photo-1",
            {
                resource_type: "image",
                invalidate: true,
            }
        );
    });

    test("supprime les vidéos comme des ressources video", async () => {
        await cleanupCloudinaryMedia(
            {
                videos: [{ public_id: "azoodie/construction-reports/video-1" }],
            },
            cloudinary,
            logger
        );

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            "azoodie/construction-reports/video-1",
            {
                resource_type: "video",
                invalidate: true,
            }
        );
    });

    test("utilise filename si public_id est absent", async () => {
        await cleanupCloudinaryMedia(
            {
                photos: [{ filename: "photo-2" }],
            },
            cloudinary,
            logger
        );

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            "photo-2",
            {
                resource_type: "image",
                invalidate: true,
            }
        );
    });

    test("journalise les erreurs sans interrompre le nettoyage", async () => {
        cloudinary.uploader.destroy
            .mockRejectedValueOnce(new Error("Cloudinary indisponible"))
            .mockResolvedValueOnce({ result: "ok" });

        await cleanupCloudinaryMedia(
            {
                photos: [{ public_id: "photo-3" }],
                videos: [{ public_id: "video-3" }],
            },
            cloudinary,
            logger
        );

        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(2);
        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    test("ignore un fichier sans identifiant Cloudinary", async () => {
        await cleanupCloudinaryMedia(
            {
                photos: [{}],
            },
            cloudinary,
            logger
        );

        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
});
