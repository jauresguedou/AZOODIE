const pool = require("../config/database");

const sortOptions = {
    price_asc: "o.price_fcfa ASC, o.last_price_update DESC",
    price_desc: "o.price_fcfa DESC, o.last_price_update DESC",
    recent: "o.last_price_update DESC, o.price_fcfa ASC"
};

async function getActiveOffers(filters = {}) {
    const conditions = [
        "o.offer_status = 'active'"
    ];

    const params = [];
    let paramIndex = 1;

    if (filters.search) {
        conditions.push(
            `(m.name ILIKE $${paramIndex}
              OR m.category ILIKE $${paramIndex}
              OR COALESCE(m.brand, '') ILIKE $${paramIndex})`
        );
        params.push(`%${filters.search}%`);
        paramIndex++;
    }

    if (filters.department) {
        conditions.push(`s.department ILIKE $${paramIndex}`);
        params.push(filters.department);
        paramIndex++;
    }

    if (filters.commune) {
        conditions.push(`s.commune ILIKE $${paramIndex}`);
        params.push(filters.commune);
        paramIndex++;
    }

    // Only use predefined SQL sorting expressions.
    const orderBy =
        sortOptions[filters.sort] || sortOptions.price_asc;

    const query = `
        SELECT
            o.id AS offer_id,
            m.id AS material_id,
            m.name AS material_name,
            m.category,
            m.brand,
            m.specification,
            m.unit,
            o.price_fcfa,
            o.stock_quantity,
            o.stock_status,
            o.delivery_available,
            o.delivery_details,
            o.last_price_update,
            s.id AS supplier_id,
            s.business_name,
            s.department,
            s.commune,
            s.verified
        FROM supplier_offers o
        JOIN materials m ON m.id = o.material_id
        JOIN suppliers s ON s.id = o.supplier_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY ${orderBy}
        LIMIT 1
    `;

    const result = await pool.query(query, params);
    return result.rows;
}

module.exports = {
    getActiveOffers
};