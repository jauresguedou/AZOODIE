const pool = require("../config/database");


async function getAllProfessionals() {
    const result = await pool.query("SELECT * FROM professionals ORDER BY created_at DESC");
    return result.rows;
}

async function createProfessional(data, database = pool) {
    const result = await database.query(
        `
        INSERT INTO professionals
        (name, trade_category, service_radius_km, base_lat, base_lng, address_text, verified, availability_status, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,

       [
        data.name,
        data.trade_category,
        data.service_radius_km,
        data.base_lat,
        data.base_lng,
        data.address_text,
        data.verified,
        data.availability_status,
        data.photo_urls,
       ]
    );
    return result.rows[0];
}



async function getNearbyProfessionals(lat, lng, options = {}) {



  const maxDistanceKm = options.maxDistanceKm || 25;
  const category = options.category || null;
  const minRating = options.minRating || null;
  const sortBy = options.sortBy || "distance";

  const conditions = ["availability_status = 'available' "];
  const params = [lat, lng];
  let paramIndex = 3;

  if (category) {
    conditions.push(`trade_category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  let orderClause = "distance_km ASC";
   if (sortBy === 'rating') {
       orderClause = "rating_avg DESC, distance_km ASC";

   }

   params.push(maxDistanceKm);
   const maxDistanceParam = paramIndex;
   paramIndex++;

   let havingRating = "";
   if (minRating) {
      params.push(minRating);
      havingRating = `AND rating_avg >= $${paramIndex}`;
   }
  const result = await pool.query(
    `SELECT * FROM (
        SELECT *,
          ( 6371 * acos(
              cos(radians($1)) * cos(radians(base_lat)) *
              cos(radians(base_lng) - radians($2)) +
              sin(radians($1)) * sin(radians(base_lat))
            )
          ) AS distance_km
        FROM professionals
        WHERE ${whereClause}
     ) AS professionals_with_distance
     WHERE distance_km <= $${maxDistanceParam}${havingRating}
     ORDER BY ${orderClause}`,
     params
  );
  return result.rows;
}


async function getProfessionalById(id) {

    const professionalId = Number(id);

    if(!Number.isInteger(professionalId)) {
        return null;
    }
     
    const result = await pool.query(
        "SELECT * FROM professionals WHERE id = $1",
        [id]
    );
    return result.rows[0];


}

async function updateProfessional(id, data) {
    const result = await pool.query(

     `UPDATE professionals
      SET name = $1, trade_category = $2, service_radius_km = $3,
          base_lat = $4, base_lng = $5, address_text = $6, availability_status = $7

      WHERE id = $8
      RETURNING *`,
      [data.name, data.trade_category, data.service_radius_km, data.base_lat, data.base_lng, data.address_text, data.availability_status, id]
    );

    return result.rows[0];
}

async function deleteProfessional(id) {
    const result = await pool.query("DELETE FROM professionals WHERE id = $1", [id]);
    return result.rowCount;
}

async function addPhotoToProfessional(id, photoUrl) {
    const result = await pool.query(
     
     `UPDATE professionals
      SET photo_urls = array_append(photo_urls, $1)
      WHERE id = $2
      RETURNING *`,
    [photoUrl, id]
    );
    return result.rows[0];
}

async function getPortfolioPosts(professionalId) {
    const result = await pool.query(
        `SELECT id, professional_id, caption, media_url, media_type, created_at
         FROM professional_portfolio_posts
         WHERE professional_id = $1
         ORDER BY created_at DESC, id DESC`,
        [professionalId]
    );
    return result.rows;
}

async function createPortfolioPost(professionalId, post) {
    const result = await pool.query(
        `INSERT INTO professional_portfolio_posts
            (professional_id, caption, media_url, media_type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, professional_id, caption, media_url, media_type, created_at`,
        [professionalId, post.caption, post.mediaUrl, post.mediaType]
    );
    return result.rows[0];
}

async function deletePortfolioPost(professionalId, postId) {
    const result = await pool.query(
        `DELETE FROM professional_portfolio_posts
         WHERE professional_id = $1 AND id = $2`,
        [professionalId, postId]
    );
    return result.rowCount;
}

async function getUsersToNotifyForRequest(lat, lng, database = pool) {
    const result = await database.query(
        `SELECT u.id AS user_id, p.name AS professional_name FROM  (
             SELECT *,
                (6371 * acos(
                    cos(radians($1)) * cos(radians(base_lat)) *
                    cos(radians(base_lng) - radians($2)) +
                    sin(radians($1)) * sin(radians(base_lat))
                
                )
             )AS distance_km
             FROM professionals
             WHERE availability_status = 'available'
            )AS p
            JOIN users u ON u.professional_id = p.id
            WHERE p.distance_km <= p.service_radius_km `,
            [lat, lng]
    );
    return result.rows;
}



module.exports = {
    getAllProfessionals,
    createProfessional,
    getNearbyProfessionals,
    getProfessionalById,
    updateProfessional,
    deleteProfessional,
    addPhotoToProfessional,
    getPortfolioPosts,
    createPortfolioPost,
    deletePortfolioPost,
    getUsersToNotifyForRequest
};