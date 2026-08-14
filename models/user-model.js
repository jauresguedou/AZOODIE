const pool = require("../config/database");

const bcrypt = require("bcrypt");



async function createUser(data) {
     
    const password_hash = await bcrypt.hash(data.password, 10);


    const result = await pool.query(

         `
            INSERT INTO users (name, email, password_hash, role)
            VALUES($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at`,
            [data.name, data.email, password_hash, data.role || "client"]


    );

    return result.rows[0];

}


async function findUserByEmail(email) {
    const result  = await pool.query(
       "SELECT * FROM users WHERE email = $1",
       [email]

    );

    return result.rows[0];
}

module.exports = { createUser, findUserByEmail };