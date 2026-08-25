const express = require("express");
const path = require("path");
const pool = require("./config/database");
const session = require("express-session");
const professionalRoute = require("./routes/professionalRoute");
const searchRoute = require("./routes/searchRoute");
const requestRoute = require("./routes/requestRoute");
const favoriteRoute = require("./routes/favoriteRoute");
const authRoute = require("./routes/authRoute");
const apiRoute = require("./routes/apiRoute");
const adminRoute = require("./routes/adminRoute");
const { getUnreadCount } = require("./models/notification-model");
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

app.use(async (req, res, next) => {
    if (req.session.userId && req.session.professionalId){
        res.locals.unreadCount = await getUnreadCount(req.session.userId);
    }else {
        res.locals.unreadCount = 0;
    }
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
app.use("/api", apiRoute);
app.use("/admin", adminRoute);

module.exports = app;