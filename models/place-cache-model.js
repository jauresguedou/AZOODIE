const pool = require("../config/database");

const CACHE_TTL = "30 days";

function normalizeSearchQuery(searchQuery) {
    if (typeof searchQuery !== "string" || searchQuery.trim().length < 3) {
        throw new TypeError("Search query must contain at least 3 characters.");
    }

    return searchQuery.trim().toLowerCase();
}

async function getCachedPlaces(searchQuery) {
    const normalizedQuery = normalizeSearchQuery(searchQuery);
    const result = await pool.query(
        `SELECT results FROM place_cache
         WHERE search_query = $1
           AND results IS NOT NULL
           AND last_fetched_at > NOW() - INTERVAL '${CACHE_TTL}'`,
        [normalizedQuery]
    );

    return result.rows[0]?.results ?? null;
}

async function saveCachedPlaces(searchQuery, places) {
    const normalizedQuery = normalizeSearchQuery(searchQuery);

    if (!Array.isArray(places)) {
        throw new TypeError("Cached places must be an array.");
    }

    await pool.query(
        `INSERT INTO place_cache (search_query, results, last_fetched_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (search_query)
         DO UPDATE SET results = EXCLUDED.results, last_fetched_at = NOW()`,
        [normalizedQuery, JSON.stringify(places)]
    );
}

module.exports = { getCachedPlaces, saveCachedPlaces };