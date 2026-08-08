const express = require("express");

const router = express.Router();

const { searchNearby } = require("../controllers/professionalController");

router.get("/", searchNearby);

module.exports = router;