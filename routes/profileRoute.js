const express = require("express");
const router = express.Router();
const { showMyProfile, uploadMyPhoto } = require("../controllers/clientController");
const {requireLogin} = require("../middleware/auth");
const upload = require("../config/cloudinary");

router.get("/", requireLogin, showMyProfile);
router.post("/photo", requireLogin, upload.single("photo"), uploadMyPhoto);

module.exports = router;