const { createCredential, getCredentialsByProfessional, deleteCredential } = require("../models/credential-model");

async function addCredential(req, res) {
    if (!req.file || !req.file.secure_url) {
        return res.status(400).send("Ajoutez un fichier (image ou PDF) pour ce document.");
    }
    
    const { credential_type, title, issuing_body, expiry_date } = req.body;

    const allowedCredentialTypes = [
    "certification",
    "insurance",
    "diploma",
    "professional_certificate",
    "technical_diploma",
    "higher_education",
    "safety_certificate"
];

if (!title?.trim() || !allowedCredentialTypes.includes(credential_type)) {
    return res.status(400).send("Titre et type de document valides sont requis.");
}

    await createCredential(req.params.id, {
        credentialType: credential_type,
        title: title.trim(),
        issuingBody: issuing_body ? issuing_body.trim() : null,
        documentUrl: req.file.secure_url,
        expiryDate: expiry_date || null,
    });

    res.redirect(`/professionals/${req.params.id}/edit`);
}

async function deleteCredentialHandler(req, res) {
    const deletedCount = await deleteCredential(req.params.id, req.params.credentialId);
    if (deletedCount === 0) {
        return res.status(404).send("Document non trouvé ou vous n'avez pas la permission de le supprimer.");
    }
    res.redirect(`/professionals/${req.params.id}/edit`);
}

module.exports = { addCredential, deleteCredentialHandler };