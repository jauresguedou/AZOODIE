
const pool = require("../config/database");

async function createOffer(supplierId, data) {
  const query = `
    INSERT INTO supplier_offers (
      supplier_id,
      material_id,
      price_fcfa,
      stock_quantity,
      stock_status,
      delivery_available,
      delivery_details,
      offer_status,
      last_price_update,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW(), NOW()
    )
    RETURNING *;
  `;

  const values = [
    supplierId,
    data.material_id,
    data.price_fcfa,
    data.stock_quantity === "" || data.stock_quantity == null
      ? null
      : data.stock_quantity,
    data.stock_status,
    data.delivery_available === "true",
    data.delivery_details || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getOffersBySupplier(supplierId) {
  const query = `
    SELECT
      o.id AS offer_id,
      o.material_id,
      m.name AS material_name,
      m.category,
      m.specification,
      m.unit,
      o.price_fcfa,
      o.stock_quantity,
      o.stock_status,
      o.delivery_available,
      o.delivery_details,
      o.offer_status,
      o.last_price_update
    FROM supplier_offers o
    JOIN materials m ON m.id = o.material_id
    WHERE o.supplier_id = $1
    ORDER BY o.created_at DESC;
  `;

  const result = await pool.query(query, [supplierId]);
  return result.rows;
}

module.exports = {
  createOffer,
  getOffersBySupplier
};
