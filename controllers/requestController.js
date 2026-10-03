const { createRequest, getNearbyRequestsForProfessional } = require("../models/request-model");
const { getProfessionalById } = require("../models/professional-model");
const { getAllOpenAnnouncements } = require("../models/request-model");
const { notifyProfessionalsForRequest } = require("../services/controllers/matchingService");
const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");
const tradeCategories = require("../config/tradeCategories");


async function showContactForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    res.render("requests/contact-form", {
        title: `Contacter ${professional.name} — AZÔÔDIÉ`,
        professional,
        formValues: {},
        errors: [],
    });
}


async function showJobLeads(req, res) {
    if (!req.session.professionalId) {
        return res.status(403).send("Cette page est réservée aux professionals ayant un profil.");
    }

    const professional = await getProfessionalById(req.session.professionalId);
    if (!professional) {
        req.session.professionalId = null;
        await new Promise((resolve, reject) => {
            req.session.save((error) => error ? reject(error) : resolve());
        });
        return res.redirect("/professionals/add");
    }
    const leads = await getNearbyRequestsForProfessional(
        professional.base_lat,
        professional.base_lng,
        professional.service_radius_km

    );

    res.render("professionals/leads", {
        title: "Demandes à proximité — AZÔÔDIÉ",
        professional,
        leads,
    });
}

async function submitRequest(req, res) {
    const professional = await getProfessionalById(req.body.professional_id);
    if (!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    await withTransaction(pool, async (client) => {
        await createRequest({
            client_id: req.session.userId,
            category: req.body.category,
            description: req.body.description,
            address_text: req.body.address_text,
            lat: req.body.lat,
            lng: req.body.lng,
            budget_estimate: req.body.budget_estimate,
        }, client);

        await notifyProfessionalsForRequest({
            lat: req.body.lat,
            lng: req.body.lng,
            category: req.body.category,
        }, client);
    });

    res.redirect(`/professionals/${professional.id}`);
}

async function renderAnnouncementFeed(req, res, options = {}) {
    const announcements = await getAllOpenAnnouncements();
    res.status(options.status || 200).render("requests/feed", {
        title: "Annonces de travaux — AZÔÔDIÉ",
        announcements,
        tradeCategories,
        formValues: options.formValues || {},
        errors: options.errors || [],
        headContent: '<script src="/js/announcement-composer.js" defer></script>',
    });
}

async function showAnnouncementFeed(req, res) {
    return renderAnnouncementFeed(req, res);
}

async function publishAnnouncement(req, res) {
    if (req.session.userRole !== "client") {
        return res.status(403).send("La publication d’annonces est réservée aux clients.");
    }

    const fields = ["category", "work_title", "description", "address_text", "lat", "lng"];
    const formValues = Object.fromEntries(fields.concat([
        "professional_requirements",
        "project_timeline",
        "budget_estimate",
    ]).map((field) => [field, typeof req.body[field] === "string" ? req.body[field].trim() : ""]));
    const errors = [];
    const knownTrades = tradeCategories.flatMap((group) => group.trades);

    if (!knownTrades.includes(formValues.category)) errors.push("Choisissez un métier dans la liste des professionnels.");
    if (!formValues.work_title) errors.push("Donnez un intitulé précis à votre mission.");
    if (formValues.work_title.length > 150) errors.push("L’intitulé ne peut pas dépasser 150 caractères.");
    if (!formValues.description) errors.push("Décrivez les travaux à réaliser.");
    if (formValues.description.length > 5000) errors.push("La description ne peut pas dépasser 5 000 caractères.");
    if (formValues.professional_requirements.length > 2000) errors.push("Les critères professionnels ne peuvent pas dépasser 2 000 caractères.");
    if (formValues.project_timeline.length > 100) errors.push("Le délai ne peut pas dépasser 100 caractères.");
    if (!formValues.address_text) errors.push("Sélectionnez le lieu des travaux dans les suggestions.");

    const lat = Number(formValues.lat);
    const lng = Number(formValues.lng);
    if (!formValues.lat || !formValues.lng
        || !Number.isFinite(lat) || lat < -90 || lat > 90
        || !Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.push("Sélectionnez une adresse valide dans les suggestions.");
    }

    let budgetEstimate = null;
    if (formValues.budget_estimate) {
        budgetEstimate = Number(formValues.budget_estimate);
        if (!Number.isFinite(budgetEstimate) || budgetEstimate < 0) {
            errors.push("Le budget doit être un montant positif.");
        }
    }

    if (errors.length) {
        return renderAnnouncementFeed(req, res, { status: 400, errors, formValues });
    }

    await withTransaction(pool, async (client) => {
        await createRequest({
            client_id: req.session.userId,
            category: formValues.category,
            work_title: formValues.work_title,
            description: formValues.description,
            professional_requirements: formValues.professional_requirements,
            project_timeline: formValues.project_timeline,
            address_text: formValues.address_text,
            lat,
            lng,
            budget_estimate: budgetEstimate,
        }, client);

        await notifyProfessionalsForRequest({ lat, lng, category: formValues.category }, client);
    });

    return res.redirect("/requests/feed");
}
module.exports = { showContactForm, submitRequest, showJobLeads, showAnnouncementFeed, publishAnnouncement };