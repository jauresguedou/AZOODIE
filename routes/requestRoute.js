const express = require("express");

const router = express.Router();

const  { showContactForm, submitRequest, showAnnouncementFeed, publishAnnouncement } = require("../controllers/requestController");
const {requestValidationRules, checkValidation} = require("../middleware/validation");
const  { requireLogin } = require("../middleware/auth");
router.get("/new/:id", requireLogin, showContactForm);
router.post("/",  requireLogin, requestValidationRules(), checkValidation, submitRequest);
router.get("/feed", requireLogin, showAnnouncementFeed  );
router.post("/feed", requireLogin, publishAnnouncement);


module.exports = router;