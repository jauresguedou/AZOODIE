process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

const cloudinary = require("cloudinary").v2;

const {
    createSupplierVerificationDocumentUrl,
} = require("../utils/supplierVerificationDocumentUrl");

describe("Supplier verification document URL", () => {
    let downloadUrlSpy;

    beforeEach(() => {
        downloadUrlSpy = jest
            .spyOn(cloudinary.utils, "private_download_url")
            .mockReturnValue("https://example.test/private-download");
    });

    afterEach(() => {
        downloadUrlSpy.mockRestore();
    });

    test("génère un lien signé pour un document autorisé", () => {
        const before = Math.floor(Date.now() / 1000);

        const result = createSupplierVerificationDocumentUrl({
            publicId: "azoodie/supplier-verification/document-123",
            format: "pdf",
        });

        const after = Math.floor(Date.now() / 1000);

        expect(result).toBe("https://example.test/private-download");
        expect(downloadUrlSpy).toHaveBeenCalledTimes(1);

        const [publicId, format, options] =
            downloadUrlSpy.mock.calls[0];

        expect(publicId).toBe(
            "azoodie/supplier-verification/document-123"
        );
        expect(format).toBe("pdf");
        expect(options.resource_type).toBe("image");
        expect(options.type).toBe("authenticated");
        expect(options.attachment).toBe(true);
        expect(options.expires_at).toBeGreaterThanOrEqual(before + 300);
        expect(options.expires_at).toBeLessThanOrEqual(after + 300);
    });

    test("refuse un identifiant hors du dossier autorisé", () => {
        expect(() =>
            createSupplierVerificationDocumentUrl({
                publicId: "azoodie/announcements/document-123",
                format: "pdf",
            })
        ).toThrow("Identifiant de document de vérification invalide.");

        expect(downloadUrlSpy).not.toHaveBeenCalled();
    });

    test("refuse les formats non autorisés", () => {
        expect(() =>
            createSupplierVerificationDocumentUrl({
                publicId: "azoodie/supplier-verification/document-123",
                format: "exe",
            })
        ).toThrow("Format de document de vérification invalide.");

        expect(downloadUrlSpy).not.toHaveBeenCalled();
    });
});
