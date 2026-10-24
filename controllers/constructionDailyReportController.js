
const constructionProjectModel = require("../models/construction-project-model");
const dailyReportModel = require("../models/construction-daily-report-model");

// Initialise Cloudinary using AZÔÔDIÉ's existing configuration.
require("../config/cloudinary");
const cloudinary = require("cloudinary").v2;
const cleanupCloudinaryMedia = require("../utils/cloudinaryMediaCleanup");

/**
 * Remove uploaded media without masking the original error.
 */
async function cleanupUploadedMedia(files = {}) {
    await cleanupCloudinaryMedia(files, cloudinary);
}

/**
 * Convert Multer/Cloudinary files into database media records.
 */
function getUploadedMedia(files = {}) {
    const media = [];

    for (const file of files.photos || []) {
        const publicId = file.public_id || file.filename;
        const mediaUrl = file.secure_url || file.path;

        if (!publicId || !mediaUrl) {
            throw new Error(
                "Impossible de récupérer les informations d'une photo téléversée."
            );
        }

        media.push({
            publicId,
            mediaUrl,
            mediaType: "image"
        });
    }

    for (const file of files.videos || []) {
        const publicId = file.public_id || file.filename;
        const mediaUrl = file.secure_url || file.path;

        if (!publicId || !mediaUrl) {
            throw new Error(
                "Impossible de récupérer les informations d'une vidéo téléversée."
            );
        }

        media.push({
            publicId,
            mediaUrl,
            mediaType: "video"
        });
    }

    return media;
}


function parseProjectId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function renderNotFound(res) {
    return res.status(404).send("Chantier ou rapport introuvable — AZÔÔDIÉ");
}

async function getAuthorizedProject(req, res) {
    const projectId = parseProjectId(req.params.projectId);

    if (!projectId) {
        renderNotFound(res);
        return null;
    }

    const project = await constructionProjectModel.getProjectForUser(
        projectId,
        req.session.userId
    );

    if (!project) {
        renderNotFound(res);
        return null;
    }

    return project;
}

/**
 * Verify project access and creation role BEFORE uploading any files.
 */
async function authorizeDailyReportCreation(req, res, next) {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    if (!["owner", "site_manager"].includes(project.access_role)) {
        return res.status(403).send(
            "Vous n'êtes pas autorisé à créer un rapport pour ce chantier."
        );
    }

    return next();
}

/**
 * Display all daily reports for an accessible project.
 */
async function listDailyReports(req, res) {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    const reports = await dailyReportModel.getReportsForProject(
        project.id,
        req.session.userId
    );

    if (reports === null) {
        return renderNotFound(res);
    }

    return res.render("chantiers/reports", {
        title: `Rapports journaliers — ${project.title}`,
        project,
        reports
    });
}

/**
 * Display the new report form for owners and site managers.
 */
async function showNewReportForm(req, res) {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    if (!["owner", "site_manager"].includes(project.access_role)) {
        return res.status(403).send("Vous n'êtes pas autorisé à créer un rapport.");
    }

    return res.render("chantiers/report-new", {
        title: `Nouveau rapport — ${project.title}`,
        project,
        formValues: {
            report_date: new Date().toISOString().slice(0, 10),
            progress_percentage: String(project.progress_percentage ?? 0),
            work_completed: "",
            workers_count: "",
            materials_used: "",
            difficulties: "",
            notes: ""
        },
        errors: []
    });
}

/**
 * Validate and save a daily report.
 */
/**
 * Re-display the report form when media upload validation fails.
 */
async function renderDailyReportUploadError(req, res, error) {
    const project = await getAuthorizedProject(req, res);
    if (!project) return;

    if (!["owner", "site_manager"].includes(project.access_role)) {
        return res.status(403).send(
            "Vous n'êtes pas autorisé à créer un rapport."
        );
    }

    const body = req.body || {};
    const value = (field) =>
        typeof body[field] === "string" ? body[field] : "";

    const formValues = {
        report_date: value("report_date") ||
            new Date().toISOString().slice(0, 10),
        progress_percentage: value("progress_percentage"),
        work_completed: value("work_completed"),
        workers_count: value("workers_count"),
        materials_used: value("materials_used"),
        difficulties: value("difficulties"),
        notes: value("notes")
    };

   
    let message;

    if (error.code === "LIMIT_FILE_SIZE") {
        message = "Chaque fichier doit peser au maximum 25 Mo.";
    } else if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
        message = "Limite dépassée : 10 photos et 3 vidéos maximum.";
    } else if (error.name === "MulterError") {
        message = "Le téléversement du média a échoué. Vérifiez les fichiers sélectionnés.";
    } else if (error.message?.startsWith("Format non autorisé.")) {
        message = error.message;
    } else {
        message = "Le téléversement du média a échoué. Veuillez réessayer.";
    }


    return res.status(400).render("chantiers/report-new", {
        title: `Nouveau rapport — ${project.title}`,
        project,
        formValues,
        errors: [message]
    });
}

async function createDailyReport(req, res) {
    const files = req.files || {};
    const project = await getAuthorizedProject(req, res);

    if (!project) {
        await cleanupUploadedMedia(files);
        return;
    }

    if (!["owner", "site_manager"].includes(project.access_role)) {
        await cleanupUploadedMedia(files);
        return res.status(403).send(
            "Vous n'êtes pas autorisé à créer un rapport."
        );
    }

    const body = req.body || {};

    const formValues = {
        report_date: typeof body.report_date === "string"
            ? body.report_date.trim()
            : "",
        progress_percentage: typeof body.progress_percentage === "string"
            ? body.progress_percentage.trim()
            : "",
        work_completed: typeof body.work_completed === "string"
            ? body.work_completed.trim()
            : "",
        workers_count: typeof body.workers_count === "string"
            ? body.workers_count.trim()
            : "",
        materials_used: typeof body.materials_used === "string"
            ? body.materials_used.trim()
            : "",
        difficulties: typeof body.difficulties === "string"
            ? body.difficulties.trim()
            : "",
        notes: typeof body.notes === "string"
            ? body.notes.trim()
            : ""
    };

    const errors = [];

    let progressPercentage = null;

    if (!/^\d+$/.test(formValues.progress_percentage)) {
        errors.push(
            "L'avancement du chantier doit être un entier entre 0 et 100."
        );
    } else {
        progressPercentage = Number(formValues.progress_percentage);

        if (
            !Number.isSafeInteger(progressPercentage) ||
            progressPercentage < 0 ||
            progressPercentage > 100
        ) {
            errors.push(
                "L'avancement du chantier doit être compris entre 0 et 100 %."
            );
        }
    }

    if (!isValidDate(formValues.report_date)) {
        errors.push("Indiquez une date de rapport valide.");
    }

    if (!formValues.work_completed) {
        errors.push("Décrivez les travaux réalisés.");
    } else if (formValues.work_completed.length > 10000) {
        errors.push(
            "La description des travaux ne doit pas dépasser 10 000 caractères."
        );
    }

    let workersCount = null;

    if (formValues.workers_count !== "") {
        if (!/^\d+$/.test(formValues.workers_count)) {
            errors.push(
                "Le nombre d'ouvriers doit être un entier positif ou nul."
            );
        } else {
            workersCount = Number(formValues.workers_count);

            if (
                !Number.isSafeInteger(workersCount) ||
                workersCount > 1000000
            ) {
                errors.push(
                    "Le nombre d'ouvriers indiqué n'est pas valide."
                );
            }
        }
    }

    const optionalFields = [
        ["materials_used", "Les matériaux utilisés"],
        ["difficulties", "Les difficultés"],
        ["notes", "Les notes"]
    ];

    for (const [field, label] of optionalFields) {
        if (formValues[field].length > 5000) {
            errors.push(
                `${label} ne doit pas dépasser 5 000 caractères.`
            );
        }
    }

    if (errors.length > 0) {
        await cleanupUploadedMedia(files);

        return res.status(400).render("chantiers/report-new", {
            title: `Nouveau rapport — ${project.title}`,
            project,
            formValues,
            errors
        });
    }

    let media;

    try {
        media = getUploadedMedia(files);
    } catch (error) {
        await cleanupUploadedMedia(files);
        throw error;
    }

    let report;

    try {
        report = await dailyReportModel.createDailyReportWithMedia(
            {
                projectId: project.id,
                userId: req.session.userId,
                reportDate: formValues.report_date,
                progressPercentage,
                workCompleted: formValues.work_completed,
                workersCount,
                materialsUsed: formValues.materials_used,
                difficulties: formValues.difficulties,
                notes: formValues.notes
            },
            media
        );
    } catch (error) {
        await cleanupUploadedMedia(files);
        throw error;
    }

    if (!report) {
        await cleanupUploadedMedia(files);

        return res.status(403).send(
            "Vous n'êtes pas autorisé à créer un rapport pour ce chantier."
        );
    }

    return res.redirect(`/chantiers/${project.id}/rapports`);
}
module.exports = {
    authorizeDailyReportCreation,
    listDailyReports,
    showNewReportForm,
    createDailyReport,
    renderDailyReportUploadError,
};
