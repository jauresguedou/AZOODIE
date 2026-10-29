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

async function getAdminDashboardSummary() {
    const result = await pool.query(`
        SELECT
            COUNT(*) FILTER (
                WHERE role = 'client'
            )::int AS clients_count,

            COUNT(*) FILTER (
                WHERE role = 'professional'
            )::int AS professionals_count,

            COUNT(*) FILTER (
                WHERE role = 'supplier'
            )::int AS suppliers_count,

            (
                SELECT COUNT(*)::int
                FROM supplier_verification_requests
                WHERE status = 'pending'
            ) AS pending_supplier_verifications

        FROM users
    `);

    return result.rows[0];
}

module.exports = {
    getCoverageSummary,
    getAdminDashboardSummary,
};