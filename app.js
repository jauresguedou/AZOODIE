const express = require("express");
const path = require("path");
const pool = require("./config/database");
const session = require("express-session");
const professionalRoute = require("./routes/professionalRoute");
const searchRoute = require("./routes/searchRoute");
const requestRoute = require("./routes/requestRoute");
const favoriteRoute = require("./routes/favoriteRoute");
const authRoute = require("./routes/authRoute");
const app = express();


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: {maxAge: 1000 * 60 * 60* 24}
}));
app.use((req,res,next) => {
    res.locals.session = req.session;
    next();
});

app.get("/", (req, res) => {
    res.render("home/index", {title: "AZÔÔDIÉ", session: req.session});
});




app.use("/professionals", professionalRoute);
app.use("/search", searchRoute);
app.use("/requests", requestRoute);
app.use("/favorites", favoriteRoute);
app.use("/", authRoute);

module.exports = app;