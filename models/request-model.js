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

async function getNearbyRequestsForProfessional(baseLat, baseLng, maxDistanceKm) {
  const result = await pool.query(
    `SELECT * FROM (
         SELECT *,
            ( 6371 * acos(
                cos(radians($1)) * cos(radians(lat)) *
                cos(radians(lng) - radians($2)) + 
                sin(radians($1)) * sin(radians(lat))
            
            
            ) 
                
              ) AS distance_km
          FROM requests
          WHERE status = 'open'
    
    ) AS requests_with_distance
    WHERE distance_km <= $3
    ORDER BY distance_km ASC`,
    [baseLat, baseLng, maxDistanceKm]
  );

  return result.rows;
}
module.exports = {  createRequest, getNearbyRequestsForProfessional  };