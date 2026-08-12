const express = require("express");

const router = express.Router();


const { toggleFavorite, listFavorites} = require("../controllers/favoriteController");

router.get("/", listFavorites);
router.post("/:id", toggleFavorite);


module.exports = router;