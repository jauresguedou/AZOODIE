const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const {
    ensureConstructionCsrfToken,
    verifyConstructionCsrf
} = require("../middleware/constructionCsrf");
const uploadConstructionReportMedia = require("../config/constructionDailyReportUpload");
const {
    listProjects,
    showNewProjectForm,
    createProject,
    showProject
} = require("../controllers/constructionProjectController");

const {
    listDailyReports,
    showNewReportForm,
    createDailyReport,
    authorizeDailyReportCreation,
    renderDailyReportUploadError
} = require("../controllers/constructionDailyReportController");

const {
    inviteMember,
    listMyInvitations,
    respondToInvitation,
    showProjectMembers,
    revokeProjectMember
} = require("../controllers/constructionInvitationController");
// Convert asynchronous errors into Express errors.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// List projects belonging to the logged-in user.
router.get("/", requireLogin, asyncHandler(listProjects));

// Display invitations received by the logged-in user.
// Keep this static route before GET "/:id".
router.get(
    "/invitations",
    requireLogin,
    ensureConstructionCsrfToken,
      asyncHandler(listMyInvitations)
);

// Accept or decline an invitation.
router.post(
    "/invitations/:membershipId/reponse",
    requireLogin,
    ensureConstructionCsrfToken,
    verifyConstructionCsrf,
    asyncHandler(respondToInvitation)
);

// Invite a registered user to a project.
router.post(
    "/:projectId/invitations",
    requireLogin,
    ensureConstructionCsrfToken,
    verifyConstructionCsrf,
    asyncHandler(inviteMember)
);

// Show project members (owner only).
router.get(
    "/:projectId/membres",
    requireLogin,
    ensureConstructionCsrfToken,
      asyncHandler(showProjectMembers)
);

// Revoke a member's access (owner only).
router.post(
    "/:projectId/membres/:membershipId/revoquer",
    requireLogin,
    ensureConstructionCsrfToken,
    verifyConstructionCsrf,
    asyncHandler(revokeProjectMember)
);

// Display the project creation form.
router.get("/nouveau", requireLogin, ensureConstructionCsrfToken, showNewProjectForm);

//Display one project, only for authorized users.
router.get("/:id", requireLogin, asyncHandler(showProject));

// Save a new project.
router.post("/", requireLogin, ensureConstructionCsrfToken, verifyConstructionCsrf, asyncHandler(createProject));


//List reports for a project.
router.get("/:projectId/rapports", requireLogin, asyncHandler(listDailyReports));

// Display the new report form.
router.get("/:projectId/rapports/nouveau", requireLogin, ensureConstructionCsrfToken, asyncHandler(showNewReportForm));

// Save a daily report.
router.post(
    "/:projectId/rapports",
    requireLogin,
    ensureConstructionCsrfToken,
    verifyConstructionCsrf,
    asyncHandler(authorizeDailyReportCreation),
    (req, res, next) => {
        uploadConstructionReportMedia(req, res, (error) => {
            if (error) {
                if (error.name === "MulterError") {
                    error.status = 400;
                    error.expose = true;

                    if (error.code === "LIMIT_FILE_SIZE") {
                        error.message = "Chaque fichier doit peser au maximum 25 Mo.";
                    } else if (error.code === "LIMIT_FILE_COUNT" ||
                               error.code === "LIMIT_UNEXPECTED_FILE") {
                        error.message = "Limite dépassée : 10 photos et 3 vidéos maximum.";
                    } else {
                        error.message = "Le téléversement du média a échoué.";
                    }
                } else if (!error.status) {
                    error.status = 400;
                    error.expose = true;
                }

                return renderDailyReportUploadError(req, res, error).catch(next);
            }

            return next();
        });
    },
    asyncHandler(createDailyReport)
);

module.exports = router;
