const FILE_SIGNATURES = [
    {
        format: "pdf",
        mimeType: "application/pdf",
        matches(buffer) {
            return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
        },
    },
    {
        format: "jpg",
        mimeType: "image/jpeg",
        matches(buffer) {
            return (
                buffer.length >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );
        },
    },
    {
        format: "png",
        mimeType: "image/png",
        matches(buffer) {
            return (
                buffer.length >= 8 &&
                buffer.subarray(0, 8).equals(
                    Buffer.from([
                        0x89, 0x50, 0x4e, 0x47,
                        0x0d, 0x0a, 0x1a, 0x0a,
                    ])
                )
            );
        },
    },
    {
        format: "webp",
        mimeType: "image/webp",
        matches(buffer) {
            return (
                buffer.length >= 12 &&
                buffer.toString("ascii", 0, 4) === "RIFF" &&
                buffer.toString("ascii", 8, 12) === "WEBP"
            );
        },
    },
];

function detectSupplierVerificationFileType(buffer, declaredMimeType) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Le fichier est vide ou invalide.");
    }

    const detected = FILE_SIGNATURES.find((signature) =>
        signature.matches(buffer)
    );

    if (!detected) {
        throw new Error(
            "Contenu de fichier non reconnu. Envoyez un PDF, JPEG, PNG ou WebP valide."
        );
    }

    if (detected.mimeType !== declaredMimeType) {
        throw new Error(
            "Le contenu du fichier ne correspond pas au format déclaré."
        );
    }

    return {
        format: detected.format,
        mimeType: detected.mimeType,
    };
}

module.exports = { detectSupplierVerificationFileType };
