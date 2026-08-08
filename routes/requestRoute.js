const express = require("express");

const router = express.Router();

const  { showContactForm, submitRequest } = require("../controllers/requestController");

router.get("/new/:id", showContactForm);
router.post("/", submitRequest);


module.exports = router;