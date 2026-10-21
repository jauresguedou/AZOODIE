const express = require("express");
const router = express.Router();

const { requireLogin } = require("../middleware/auth");
const {
    listProjects,
    showNewProjectForm,
    createProject
} = require("../controllers/constructionProjectController");

// Convert asynchronous errors into Express errors.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// List projects belonging to the logged-in user.
router.get("/", requireLogin, asyncHandler(listProjects));

// Display the project creation form.
router.get("/nouveau", requireLogin, showNewProjectForm);

// Save a new project.
router.post("/", requireLogin, asyncHandler(createProject));

module.exports = router;
