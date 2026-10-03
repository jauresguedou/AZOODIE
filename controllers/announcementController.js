const announcementModel = require("../models/announcement-model");

function requireClient(req, res, next) {
    if (req.session.userRole !== "client") {
        return res.status(403).send("Seuls les clients peuvent publier des annonces.");
    }
    next();
}

function requireProfessional(req, res, next) {
    if (req.session.userRole !== "professional" || !req.session.professionalId) {
        return res.status(403).send("Cette action est réservée aux professionnels disposant d’un profil.");
    }
    next();
}

async function showHomeFeed(req, res) {
    const [announcements, drafts] = await Promise.all([
        announcementModel.getPublishedAnnouncements(req.session.userId || null),
        req.session.userRole === "client" && req.session.userId
            ? announcementModel.getClientDrafts(req.session.userId)
            : Promise.resolve([]),
    ]);
    const comments = await announcementModel.getAnnouncementComments(announcements.map((post) => post.id));
    const commentsByAnnouncement = new Map();
    comments.forEach((comment) => {
        const group = commentsByAnnouncement.get(comment.announcement_id) || [];
        group.push(comment);
        commentsByAnnouncement.set(comment.announcement_id, group);
    });

    res.render("home/index", {
        title: "Fil des annonces — AZÔÔDIÉ",
        announcements: announcements.map((post) => ({
            ...post,
            comments: commentsByAnnouncement.get(post.id) || [],
        })),
        drafts,
        formValues: {},
        errors: [],
    });
}

function renderFeedWithErrors(req, res, errors) {
    return Promise.all([
        announcementModel.getPublishedAnnouncements(req.session.userId || null),
        announcementModel.getClientDrafts(req.session.userId),
    ]).then(async ([announcements, drafts]) => {
        const comments = await announcementModel.getAnnouncementComments(announcements.map((post) => post.id));
        const commentsByAnnouncement = new Map();
        comments.forEach((comment) => {
            const group = commentsByAnnouncement.get(comment.announcement_id) || [];
            group.push(comment);
            commentsByAnnouncement.set(comment.announcement_id, group);
        });
        res.status(400).render("home/index", {
            title: "Fil des annonces — AZÔÔDIÉ",
            announcements: announcements.map((post) => ({
                ...post,
                comments: commentsByAnnouncement.get(post.id) || [],
            })),
            drafts,
            formValues: req.body,
            errors,
        });
    });
}

async function createAnnouncement(req, res) {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const category = typeof req.body.category === "string" ? req.body.category.trim() : "";
    const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
    const addressText = typeof req.body.address_text === "string" ? req.body.address_text.trim() : "";
    const errors = [];

    if (!title) errors.push("Ajoutez un titre à votre annonce.");
    if (title.length > 180) errors.push("Le titre ne peut pas dépasser 180 caractères.");
    if (!category) errors.push("Indiquez le métier ou le type de travaux.");
    if (category.length > 80) errors.push("Le métier ne peut pas dépasser 80 caractères.");
    if (!description) errors.push("Décrivez les travaux souhaités.");
    if (description.length > 5000) errors.push("La description ne peut pas dépasser 5 000 caractères.");
    if (addressText.length > 255) errors.push("Le lieu ne peut pas dépasser 255 caractères.");

    const status = req.body.action;
    if (status !== "draft" && status !== "publish") {
        errors.push("Choisissez d’enregistrer le brouillon ou de publier l’annonce.");
    }
    if (errors.length) return renderFeedWithErrors(req, res, errors);

    await announcementModel.createAnnouncement({
        authorId: req.session.userId,
        title,
        category,
        description,
        addressText,
        mediaUrl: req.file ? req.file.secure_url : null,
        mediaType: req.file
            ? (req.file.mimetype.startsWith("video/") ? "video" : "image")
            : null,
        status: status === "publish" ? "published" : "draft",
    });
    res.redirect(status === "publish" ? "/#announcements" : "/#my-drafts");
}

async function publishDraft(req, res) {
    const changed = await announcementModel.publishClientDraft(req.session.userId, req.params.id);
    if (!changed) return res.status(404).send("Brouillon introuvable.");
    res.redirect("/#announcements");
}

async function deleteDraft(req, res) {
    const deleted = await announcementModel.deleteClientDraft(req.session.userId, req.params.id);
    if (!deleted) return res.status(404).send("Brouillon introuvable.");
    res.redirect("/#my-drafts");
}

async function toggleLike(req, res) {
    const result = await announcementModel.toggleAnnouncementLike(req.session.userId, req.params.id);
    if (!result.exists) return res.status(404).send("Annonce introuvable.");
    res.redirect(`/#announcement-${encodeURIComponent(req.params.id)}`);
}

async function addComment(req, res) {
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
    if (!body || body.length > 1000) {
        return res.status(400).send("Le commentaire doit contenir entre 1 et 1 000 caractères.");
    }
    const created = await announcementModel.addAnnouncementComment(
        req.session.userId,
        req.params.id,
        body
    );
    if (!created) return res.status(404).send("Annonce introuvable.");
    res.redirect(`/#announcement-${encodeURIComponent(req.params.id)}`);
}

module.exports = {
    showHomeFeed,
    requireClient,
    requireProfessional,
    createAnnouncement,
    publishDraft,
    deleteDraft,
    toggleLike,
    addComment,
};
