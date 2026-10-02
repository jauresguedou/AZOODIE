const express = require("express");
const adminRoute = require("./adminRoute");
const apiRoute = require("./apiRoute");
const authRoute = require("./authRoute");
const favoriteRoute = require("./favoriteRoute");
const professionalRoute = require("./professionalRoute");
const profileRoute = require("./profileRoute");
const requestRoute = require("./requestRoute");
const searchRoute = require("./searchRoute");

const router = express.Router();

router.use("/professionals", professionalRoute);
router.use("/search", searchRoute);
router.use("/requests", requestRoute);
router.use("/favorites", favoriteRoute);
router.use("/", authRoute);
router.use("/api", apiRoute);
router.use("/admin", adminRoute);
router.use("/profile", profileRoute);

module.exports = router;