const express = require("express");
const announcementUpload = require("../config/announcementUpload");
const {
    showHomeFeed,
    requireClient,
    requireProfessional,
    createAnnouncement,
    publishDraft,
    deleteDraft,
    toggleLike,
    addComment,
} = require("../controllers/announcementController");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

function uploadAnnouncementMedia(req, res, next) {
    announcementUpload.single("media")(req, res, (error) => {
        if (!error) return next();
        if (error.code === "LIMIT_FILE_SIZE") {
            error.status = 400;
            error.expose = true;
        }
        next(error);
    });
}

router.get("/", showHomeFeed);
router.post("/announcements", requireLogin, requireClient, uploadAnnouncementMedia, createAnnouncement);
router.post("/announcements/:id/publish", requireLogin, requireClient, publishDraft);
router.post("/announcements/:id/delete", requireLogin, requireClient, deleteDraft);
router.post("/announcements/:id/like", requireLogin, requireProfessional, toggleLike);
router.post("/announcements/:id/comments", requireLogin, requireProfessional, addComment);

module.exports = router;
