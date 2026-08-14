const express = require("express");

const router = express.Router();

const  { showContactForm, submitRequest } = require("../controllers/requestController");
const  { requireLogin } = require("../middleware/auth");
router.get("/new/:id", requireLogin, showContactForm);
router.post("/",  requireLogin, submitRequest);


module.exports = router;