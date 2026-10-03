const express = require("express");
const router = express.Router();
const { listProfessionals, addProfessional, showAddForm, showDashboard, showProfile, showEditForm, editProfessional, deleteProfessionalHandler, validatePortfolioCaption, createPortfolioPostHandler, deletePortfolioPostHandler } = require("../controllers/professionalController");
const { professionalValidationRules, checkValidation } = require("../middleware/validation");
const { requireLogin, requireProfessionalRole, requireOwnership} = require("../middleware/auth");
const { showJobLeads} = require("../controllers/requestController");
const { showNotifications } = require("../controllers/notificationController");
const upload = require("../config/cloudinary");
const portfolioUpload = require("../config/portfolioUpload");


router.get("/add", requireLogin, requireProfessionalRole, showAddForm);
router.get("/dashboard", requireLogin, showDashboard);
router.get("/:id/edit", requireLogin, requireOwnership, showEditForm);
router.post("/:id/edit", requireLogin, requireOwnership, upload.single("photo"), professionalValidationRules(), checkValidation, editProfessional);
router.post("/:id/delete", requireLogin, requireOwnership,deleteProfessionalHandler);
router.get("/leads", requireLogin, showJobLeads);
router.get("/notifications", requireLogin, showNotifications);
router.post("/:id/portfolio", requireLogin, requireOwnership, portfolioUpload.single("media"), validatePortfolioCaption, createPortfolioPostHandler);
router.post("/:id/portfolio/:postId/delete", requireLogin, requireOwnership, deletePortfolioPostHandler);
router.get("/:id", showProfile);
router.get("/", listProfessionals);
router.post("/", requireLogin, requireProfessionalRole, professionalValidationRules(), checkValidation, addProfessional);



module.exports = router;
