require("dotenv").config();
const app = require("./app");
const pool = require("./config/database");
const initializeDatabase = require("./database/initialize");
const PORT = process.env.PORT || 5000;

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`AZÔÔDIÉ server is running on http://localhost:${PORT}`);
        });
    })
    .catch(async (error) => {
        console.error("Failed to initialize database schema:", error);
        await pool.end();
        process.exitCode = 1;
    });