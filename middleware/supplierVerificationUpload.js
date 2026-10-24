const uploadSupplierVerificationDocument = require(
    "../config/supplierVerificationUpload"
);

const ERROR_MESSAGES = {
    LIMIT_FILE_SIZE:
        "Chaque document doit peser au maximum 10 Mo.",
    LIMIT_FILE_COUNT:
        "Vous pouvez joindre au maximum 3 documents.",
    LIMIT_UNEXPECTED_FILE:
        "Champ de fichier inattendu. Sélectionnez au maximum 3 documents.",
};

function handleSupplierVerificationUpload(req, res, next) {
    uploadSupplierVerificationDocument(req, res, (error) => {
        if (!error) {
            return next();
        }

        const isMulterError = error.name === "MulterError";
        const isKnownClientError =
            isMulterError ||
            error.status === 400 ||
            error.message?.startsWith("Format non autorisé.");

        const status = isKnownClientError ? 400 : 500;

        let message;

        if (isMulterError) {
            message = ERROR_MESSAGES[error.code] ||
                "Le fichier envoyé est invalide.";
        } else if (
            error.message?.startsWith("Format non autorisé.")
        ) {
            message = error.message;
        } else {
            message = isKnownClientError
                ? "Le téléversement a échoué. Vérifiez vos documents."
                : "Une erreur interne a empêché le téléversement. Réessayez plus tard.";
        }

        if (status === 500) {
            console.error(
                "Erreur interne lors du téléversement des documents fournisseur :",
                error
            );
        }

        const safeError = new Error(message);
        safeError.status = status;
        safeError.expose = true;

        const accept = req.get
            ? req.get("Accept")
            : req.headers?.accept;

        if (
            typeof accept === "string" &&
            accept.includes("application/json")
        ) {
            return res.status(status).json({ message });
        }

        return next(safeError);
    });
}

module.exports = handleSupplierVerificationUpload;
