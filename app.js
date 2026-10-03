const express = require("express");
const ejs = require("ejs");
const path = require("path");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const routes = require("./routes");
const pool = require("./config/database");
const { getUnreadCount } = require("./models/notification-model");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
   throw new Error("SESSION_SECRET must be configured in production.");
}
if (isProduction) {
   app.set("trust proxy", 1);
}

app.engine("ejs", (filePath, options, callback) => {
   ejs.renderFile(filePath, options, (viewError, body) => {
      if (viewError) {
         return callback(viewError);
      }

      ejs.renderFile(
         path.join(__dirname, "views", "layouts", "main.ejs"),
         {
            ...options,
            body,
            title: options.title || "AZÔÔDIÉ",
         },
         callback
      );
   });
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({
   secret: sessionSecret || "azoodie-development-only-session-secret",
   resave: false,
   saveUninitialized: false,
   store: isProduction
      ? new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true })
      : undefined,
   cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24,
   },
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

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;