jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            destroy: jest.fn(),
        },
    },
}));

const cloudinary = require("cloudinary").v2;
const cleanupSupplierVerificationAssets = require(
    "../utils/cleanupSupplierVerificationAssets"
);

describe("cleanupSupplierVerificationAssets", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cloudinary.uploader.destroy.mockResolvedValue({
            result: "ok",
        });
    });

    test("deletes only documents in the supplier verification folder", async () => {
        const files = [
            {
                public_id:
                    "azoodie/supplier-verification/document-1",
                format: "pdf",
            },
            {
                public_id: "azoodie/professionals/profile-photo",
                format: "jpg",
            },
            {
                public_id:
                    "azoodie/supplier-verification/../other-file",
                format: "pdf",
            },
            {
                public_id: "",
                format: "pdf",
            },
        ];

        await cleanupSupplierVerificationAssets(files);

        expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            "azoodie/supplier-verification/document-1",
            {
                resource_type: "image",
                type: "authenticated",
                invalidate: true,
            }
        );
    });

    test("does not throw if Cloudinary deletion fails", async () => {
        const logger = {
            error: jest.fn(),
        };

        cloudinary.uploader.destroy.mockRejectedValue(
            new Error("Cloudinary unavailable")
        );

        await expect(
            cleanupSupplierVerificationAssets(
                [{
                    public_id:
                        "azoodie/supplier-verification/document-2",
                    format: "pdf",
                }],
                logger
            )
        ).resolves.toBeUndefined();

        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    test("does nothing when there are no valid assets", async () => {
        await cleanupSupplierVerificationAssets([
            { public_id: "azoodie/professionals/photo" },
            { public_id: "azoodie/supplier-verification/../outside" },
        ]);

        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
});
