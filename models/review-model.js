const pool = require("../config/database");

async function hasContactedProfessional(clientId, professionalId) {
  const result = await pool.query(
    "SELECT 1 FROM requests WHERE client_id = $1 AND professional_id = $2 LIMIT 1",
    [clientId, professionalId]
  );
  return result.rowCount > 0;
}

async function getOwnReview(clientId, professionalId) {
  const result = await pool.query(
    "SELECT * FROM reviews WHERE client_id = $1 AND professional_id = $2",
    [clientId, professionalId]
  );
  return result.rows[0];
}

async function upsertReview(clientId, professionalId, rating, comment) {
  await pool.query(
    `INSERT INTO reviews (client_id, professional_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (client_id, professional_id)
     DO UPDATE SET rating = $3, comment = $4, created_at = NOW()`,
    [clientId, professionalId, rating, comment]
  );
  await recalculateRating(professionalId);
}

async function getReviewsForProfessional(professionalId) {
  const result = await pool.query(
    `SELECT r.*, u.name AS client_name
     FROM reviews r
     JOIN users u ON u.id = r.client_id
     WHERE r.professional_id = $1
     ORDER BY r.created_at DESC`,
    [professionalId]
  );
  return result.rows;
}

async function recalculateRating(professionalId) {
  const result = await pool.query(
    "SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::integer AS total FROM reviews WHERE professional_id = $1",
    [professionalId]
  );
  const { avg_rating, total } = result.rows[0];
  await pool.query(
    "UPDATE professionals SET rating_avg = $1, review_count = $2 WHERE id = $3",
    [avg_rating || 0, total, professionalId]
  );
}

module.exports = { hasContactedProfessional, getOwnReview, upsertReview, getReviewsForProfessional, recalculateRating };