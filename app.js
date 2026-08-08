const express = require("express");
const path = require("path");
const pool = require("./config/database");
const professionalRoute = require("./routes/professionalRoute");
const searchRoute = require("./routes/searchRoute");
const requestRoute = require("./routes/requestRoute");
const app = express();


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("home/index", {title: "AZÔÔDIÉ"});
});


app.get("/db-test", async (req,res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(`Database connected: ${result.rows[0].now}`);
    }catch (err) {
        console.error(err);
        res.status(500).send("Database connection failed.");
    }
});

app.use("/professionals", professionalRoute);
app.use("/search", searchRoute);
app.use("/requests", requestRoute);

module.exports = app;