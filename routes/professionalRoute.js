const express = require("express");
const router = express.Router();
const { listProfessionals, addProfessional, showAddForm, showProfile } = require("../controllers/professionalController");
const { professionalValidationRules, checkValidation } = require("../middleware/validation");


router.get("/add", showAddForm);
router.get("/:id", showProfile);
router.get("/", listProfessionals);
router.post("/", professionalValidationRules(), checkValidation, addProfessional);

module.exports = router;


