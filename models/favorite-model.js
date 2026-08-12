const pool = require("../config/database");

async function addFavorite(client_id, professional_id) {
      
    const result = await pool.query(
         `INSERT INTO favorites (client_id, professional_id)
          VALUES ($1, $2)
          ON CONFLICT (client_id, professional_id) DO NOTHING
          RETURNING * `,

          [client_id, professional_id]

    );

    return result.rows[0];

}

async function removeFavorite(client_id, professional_id) {
     await pool.query(
        "DELETE FROM favorites WHERE client_id = $1 AND professional_id = $2",
        [client_id, professional_id]
     );


}


async function getFavoritesByClient(client_id) {
      const result = await pool.query(
         `SELECT professionals.* FROM favorites
          JOIN professionals ON professional_id = favorites.professional_id
          WHERE favorites.client_id = $1
          ORDER BY favorites.saved_at DESC 
         `,
         [client_id]

      );
      return result.rows;
}

async function isFavorited(client_id, professional_id) {

    const result = await pool.query(
        "SELECT 1 FROM favorites WHERE client_id = $1 AND professional_id = $2",
        [client_id, professional_id]

    );
    return result.rows.length > 0;

}

module.exports = { addFavorite, removeFavorite, getFavoritesByClient, isFavorited};