
const pool = require("../config/database");

async function getSupplierByUserId(userId) {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            business_name,
            phone,
            description,
            department,
            commune,
            address_text,
            verified,
            created_at,
            updated_at
         FROM suppliers
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0] || null;
}

async function createSupplier(userId, data) {
    const result = await pool.query(
        `INSERT INTO suppliers (
            user_id,
            business_name,
            phone,
            description,
            department,
            commune,
            address_text
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            userId,
            data.business_name,
            data.phone || null,
            data.description || null,
            data.department,
            data.commune,
            data.address_text || null
        ]
    );

    return result.rows[0];
}

module.exports = {
    getSupplierByUserId,
    createSupplier
};
