const pool = require("../config/database");


async function createRequest(data) {

    const result = await pool.query(
        `
        INSERT INTO requests
          (client_id, category, description, address_text, lat, lng, budget_estimate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,

        [
          data.client_id,
          data.category,
          data.description,
          data.address_text,
          data.lat,
          data.lng,
          data.budget_estimate || null,
        ]
    );
    return result.rows[0];
}

module.exports = {  createRequest  };