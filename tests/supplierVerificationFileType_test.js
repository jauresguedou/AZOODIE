const {
    detectSupplierVerificationFileType,
} = require("../utils/detectSupplierVerificationFileType");

describe("detectSupplierVerificationFileType", () => {
    test.each([
        [
            "PDF",
            Buffer.from("%PDF-1.7\n"),
            "application/pdf",
            "pdf",
        ],
        [
            "JPEG",
            Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]),
            "image/jpeg",
            "jpg",
        ],
        [
            "PNG",
            Buffer.from([
                0x89, 0x50, 0x4e, 0x47,
                0x0d, 0x0a, 0x1a, 0x0a,
            ]),
            "image/png",
            "png",
        ],
        [
            "WebP",
            Buffer.from("RIFF\x00\x00\x00\x00WEBP"),
            "image/webp",
            "webp",
        ],
    ])("recognizes %s", (name, buffer, mimeType, format) => {
        expect(
            detectSupplierVerificationFileType(buffer, mimeType)
        ).toEqual({ format, mimeType });
    });

    test("rejects an empty file", () => {
        expect(() =>
            detectSupplierVerificationFileType(
                Buffer.alloc(0),
                "application/pdf"
            )
        ).toThrow("vide ou invalide");
    });

    test("rejects a text file disguised as a PDF", () => {
        expect(() =>
            detectSupplierVerificationFileType(
                Buffer.from("This is not a PDF"),
                "application/pdf"
            )
        ).toThrow("non reconnu");
    });

    test("rejects a mismatch between signature and MIME type", () => {
        expect(() =>
            detectSupplierVerificationFileType(
                Buffer.from("%PDF-1.7\n"),
                "image/jpeg"
            )
        ).toThrow("ne correspond pas");
    });

    test("rejects a non-buffer input", () => {
        expect(() =>
            detectSupplierVerificationFileType(
                "fake.pdf",
                "application/pdf"
            )
        ).toThrow("vide ou invalide");
    });
});
