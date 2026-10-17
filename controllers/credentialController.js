const { createCredential, getCredentialsByProfessional, deleteCredential } = require("../models/credential-model");


async function addCredential(req, res) {
    const documentUrl = req.file?.path || req.file?.secure_url;

    if (!documentUrl) {
        return res.status(400).send(
            "Ajoutez un fichier valide (image ou PDF) pour ce document."
        );
    }

    const { credential_type, title, issuing_body, expiry_date } = req.body;

    const allowedCredentialTypes = [
        "certification",
        "insurance",
        "diploma",
        "professional_certificate",
        "technical_diploma",
        "higher_education",
        "safety_certificate",
    ];

    if (
        typeof title !== "string" ||
        !title.trim() ||
        !allowedCredentialTypes.includes(credential_type)
    ) {
        return res.status(400).send(
            "Un titre et un type de document valides sont requis."
        );
    }

    await createCredential(req.params.id, {
        credentialType: credential_type,
        title: title.trim(),
        issuingBody:
            typeof issuing_body === "string" && issuing_body.trim()
                ? issuing_body.trim()
                : null,
        documentUrl,
        expiryDate: expiry_date || null,
    });

    res.redirect(`/professionals/${req.params.id}/edit#professional-credentials`);
}


async function deleteCredentialHandler(req, res) {
    const deletedCount = await deleteCredential(req.params.id, req.params.credentialId);
    if (deletedCount === 0) {
        return res.status(404).send("Document non trouvé ou vous n'avez pas la permission de le supprimer.");
    }
    res.redirect(`/professionals/${req.params.id}/edit`);
}

module.exports = { addCredential, deleteCredentialHandler };