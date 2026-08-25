const express = require("express");
const router = express.Router();
const { listProfessionals, addProfessional, showAddForm, showProfile, showEditForm, editProfessional, deleteProfessionalHandler } = require("../controllers/professionalController");
const { professionalValidationRules, checkValidation } = require("../middleware/validation");
const { requireLogin, requireProfessionalRole, requireOwnership} = require("../middleware/auth");
const { showJobLeads} = require("../controllers/requestController");
const { showNotifications } = require("../controllers/requestController");
const upload = require("../config/cloudinary");


router.get("/add", requireLogin, requireProfessionalRole, showAddForm);
router.get("/:id/edit", requireLogin, requireOwnership, showEditForm);
router.post("/:id/edit", requireLogin, requireOwnership, upload.single("photo"), professionalValidationRules(), checkValidation, editProfessional);
router.post("/:id/delete", requireLogin, requireOwnership,deleteProfessionalHandler);
router.get("/leads", requireLogin, showJobLeads);
router.get("/:id", showProfile);
router.get("/", listProfessionals);
router.post("/", requireLogin, requireProfessionalRole, professionalValidationRules(), checkValidation, addProfessional);
router.get("/notifications", requireLogin, showNotifications);



module.exports = router;


