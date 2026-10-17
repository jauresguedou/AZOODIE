const pool = require("../config/database");

async function createCredential(professionalId, data) {
    const result = await pool.query(
        `INSERT INTO professional_credentials
            (professional_id, credential_type, title, issuing_body, document_url, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [professionalId, data.credentialType, data.title, data.issuingBody || null, data.documentUrl, data.expiryDate || null]
    );
    return result.rows[0];
}

async function getCredentialsByProfessional(professionalId) {
    const result = await pool.query(
        `SELECT * FROM professional_credentials
         WHERE professional_id = $1
         ORDER BY credential_type ASC, created_at DESC`,
        [professionalId]
    );
    return result.rows;
}

async function deleteCredential(professionalId, credentialId) {
    const result = await pool.query(
        `DELETE FROM professional_credentials
         WHERE id = $1 AND professional_id = $2`,
        [credentialId, professionalId]
    );
    return result.rowCount;
}

module.exports = { createCredential, getCredentialsByProfessional, deleteCredential };