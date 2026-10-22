const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
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
// Convert asynchronous errors into Express errors.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// List projects belonging to the logged-in user.
router.get("/", requireLogin, asyncHandler(listProjects));

// Display the project creation form.
router.get("/nouveau", requireLogin, showNewProjectForm);

//Display one project, only for authorized users.
router.get("/:id", requireLogin, asyncHandler(showProject));

// Save a new project.
router.post("/", requireLogin, asyncHandler(createProject));

//List reports for a project.
router.get("/:projectId/rapports", requireLogin, asyncHandler(listDailyReports));

// Display the new report form.
router.get("/:projectId/rapports/nouveau", requireLogin, asyncHandler(showNewReportForm));

// Save a daily report.
router.post(
    "/:projectId/rapports",
    requireLogin,
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
