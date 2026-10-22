const upload = require("../config/constructionDailyReportUpload");
const cloudinary = require("cloudinary").v2;

describe("Construction daily report upload cleanup", () => {
    let destroySpy;

    beforeEach(() => {
        destroySpy = jest
            .spyOn(cloudinary.uploader, "destroy")
            .mockResolvedValue({ result: "ok" });
    });

    afterEach(() => {
        destroySpy.mockRestore();
    });

    test("Multer nettoie une photo avec le type image", async () => {
        const file = {
            fieldname: "photos",
            filename: "azoodie/construction-reports/photo-test",
        };

        await new Promise((resolve, reject) => {
            upload.storage._removeFile({}, file, (error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        expect(destroySpy).toHaveBeenCalledWith(
            "azoodie/construction-reports/photo-test",
            { resource_type: "image", invalidate: true }
        );
    });

    test("Multer nettoie une vidéo avec le type video", async () => {
        const file = {
            fieldname: "videos",
            public_id: "azoodie/construction-reports/video-test",
        };

        await new Promise((resolve, reject) => {
            upload.storage._removeFile({}, file, (error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        expect(destroySpy).toHaveBeenCalledWith(
            "azoodie/construction-reports/video-test",
            { resource_type: "video", invalidate: true }
        );
    });
});
