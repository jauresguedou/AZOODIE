const express = require("express");

const router = express.Router();


const { toggleFavorite, listFavorites} = require("../controllers/favoriteController");
const {requireLogin} = require("../middleware/auth");

router.get("/", requireLogin, listFavorites);
router.post("/:id", requireLogin, toggleFavorite);


module.exports = router;