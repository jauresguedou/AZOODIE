const express = require("express");
const router = express.Router();
const { listProfessionals, addProfessional, showAddForm, showProfile, showEditForm, editProfessional, deleteProfessionalHandler } = require("../controllers/professionalController");
const { professionalValidationRules, checkValidation } = require("../middleware/validation");
const { requireLogin} = require("../middleware/auth");
const upload = require("../config/cloudinary");


router.get("/add", showAddForm);
router.get("/:id/edit", requireLogin, showEditForm);
router.post("/:id/edit", requireLogin, upload.single("photo"), professionalValidationRules(), checkValidation, editProfessional);
router.post("/:id/delete", requireLogin, deleteProfessionalHandler);
router.get("/:id", showProfile);
router.get("/", listProfessionals);
router.post("/", professionalValidationRules(), checkValidation, addProfessional);


module.exports = router;


