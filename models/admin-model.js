const pool = require("../config/database");

async function getCoverageSummary() {
    
    const result = await pool.query(`
        WITH request_zones AS (
           SELECT
              ROUND(lat::numeric, 1) AS zone_lat,
              ROUND(lng::numeric, 1) AS zone_lng,
              COUNT(*) AS request_count
           FROM requests
           WHERE status = 'open'
           GROUP BY ROUND(lat::numeric, 1), ROUND(lng::numeric, 1)        
        ),
        professional_zones AS(
        
            SELECT 
               ROUND(base_lat::numeric, 1) AS zone_lat,
               ROUND(base_lng::numeric, 1) AS zone_lng,
               COUNT(*) AS professional_count
            FROM professionals
            WHERE availability_status = 'available'
            GROUP BY ROUND(base_lat::numeric, 1), ROUND(base_lng::numeric, 1)
        
        )
        SELECT 
          r.zone_lat,
          r.zone_lng,
          r.request_count,
          COALESCE(p.professional_count, 0) AS professional_count
        FROM request_zones r
        LEFT JOIN professional_zones p
           ON r.zone_lat = p.zone_lat AND r.zone_lng = p.zone_lng
        ORDER BY (r.request_count::float / GREATEST(COALESCE(p.professional_count, 0), 1)) DESC;   
        
        `);
        return result.rows;


}

module.exports = { getCoverageSummary};