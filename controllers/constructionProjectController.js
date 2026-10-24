const constructionProjectModel = require("../models/construction-project-model");
const dailyReportModel = require("../models/construction-daily-report-model");

const BENIN_DEPARTMENTS = [
    "Alibori",
    "Atacora",
    "Atlantique",
    "Borgou",
    "Collines",
    "Couffo",
    "Donga",
    "Littoral",
    "Mono",
    "Ouémé",
    "Plateau",
    "Zou"
];

function renderNewProject(res, formValues = {}, errors = [], status = 200) {
    return res.status(status).render("chantiers/new", {
        title: "Nouveau chantier — AZÔÔDIÉ",
        formValues,
        errors,
        departments: BENIN_DEPARTMENTS
    });
}

async function listProjects(req, res) {
    const projects = await constructionProjectModel.getProjectsForUser(
        req.session.userId
    );

    return res.render("chantiers/index", {
        title: "Mes chantiers — AZÔÔDIÉ",
        projects
    });
}

async function showProject(req, res) {
    const projectId = Number(req.params.id);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        return res.status(404).render("404", {
            title: "Chantier introuvable — AZÔÔDIÉ"
        });
    }

    const project = await constructionProjectModel.getProjectForUser(
        projectId,
        req.session.userId
    );

    if (!project) {
       return res.status(404).send("Chantier introuvable - AZÔÔDIÉ")
    }

    const reports = await dailyReportModel.getReportsForProject(
        project.id,
        req.session.userId
    );

    if (reports === null) {
        return res.status(404).send("Chantier introuvable - AZÔÔDIÉ");
    }

    return res.render("chantiers/show", {
        title: `${project.title} — AZÔÔDIÉ`,
        project,
        reports
    });
}

function showNewProjectForm(req, res) {
    return renderNewProject(res);
}

async function createProject(req, res) {
    const title =
        typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
        typeof req.body.description === "string"
            ? req.body.description.trim()
            : "";
    const addressText =
        typeof req.body.address_text === "string"
            ? req.body.address_text.trim()
            : "";
    const department =
        typeof req.body.department === "string"
            ? req.body.department.trim()
            : "";
    const commune =
        typeof req.body.commune === "string"
            ? req.body.commune.trim()
            : "";
    const budgetRaw =
        typeof req.body.budget_estimate === "string"
            ? req.body.budget_estimate.trim()
            : "";
    const startDate =
        typeof req.body.start_date === "string"
            ? req.body.start_date.trim()
            : "";
    const targetEndDate =
        typeof req.body.target_end_date === "string"
            ? req.body.target_end_date.trim()
            : "";

    const formValues = {
        title,
        description,
        address_text: addressText,
        department,
        commune,
        budget_estimate: budgetRaw,
        start_date: startDate,
        target_end_date: targetEndDate
    };

    const errors = [];

    if (!title) {
        errors.push("Le nom du chantier est obligatoire.");
    } else if (title.length > 180) {
        errors.push("Le nom du chantier ne doit pas dépasser 180 caractères.");
    }

    if (!addressText) {
        errors.push("Indiquez le lieu du chantier.");
    } else if (addressText.length > 255) {
        errors.push("Le lieu ne doit pas dépasser 255 caractères.");
    }

    if (description.length > 5000) {
        errors.push("La description ne doit pas dépasser 5 000 caractères.");
    }

    if (department && !BENIN_DEPARTMENTS.includes(department)) {
        errors.push("Sélectionnez un département valide du Bénin.");
    }

    if (commune.length > 100) {
        errors.push("La commune ne doit pas dépasser 100 caractères.");
    }

    let budgetEstimate = null;

    if (budgetRaw !== "") {
        if (!/^\d{1,12}(\.\d{1,2})?$/.test(budgetRaw)) {
            errors.push(
                "Le budget doit être un montant positif avec au maximum deux décimales."
            );
        } else {
            budgetEstimate = Number(budgetRaw);

            if (
                !Number.isFinite(budgetEstimate) ||
                budgetEstimate < 0 ||
                budgetEstimate > 999999999999.99
            ) {
                errors.push("Le budget indiqué n'est pas valide.");
            }
        }
    }

    function isValidDate(value) {
        if (!value) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));

        return (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
        );
    }

    if (!isValidDate(startDate)) {
        errors.push("La date de début est invalide.");
    }

    if (!isValidDate(targetEndDate)) {
        errors.push("La date de fin prévue est invalide.");
    }

    if (
        startDate &&
        targetEndDate &&
        isValidDate(startDate) &&
        isValidDate(targetEndDate) &&
        targetEndDate < startDate
    ) {
        errors.push(
            "La date de fin prévue doit être postérieure ou égale à la date de début."
        );
    }

    if (errors.length > 0) {
        return renderNewProject(res, formValues, errors, 400);
    }

    await constructionProjectModel.createProject({
        ownerId: req.session.userId,
        title,
        description,
        addressText,
        department,
        commune,
        budgetEstimate,
        startDate,
        targetEndDate
    });

    return res.redirect("/chantiers");
}


module.exports = {
    listProjects,
    showNewProjectForm,
    createProject,
    showProject
};
