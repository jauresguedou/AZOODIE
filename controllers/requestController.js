const { createRequest, getNearbyRequestsForProfessional } = require("../models/request-model");
const { getProfessionalById } = require("../models/professional-model");
const { getAllOpenAnnouncements } = require("../models/request-model");
const { notifyProfessionalsForRequest } = require("../services/controllers/matchingService");
const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");


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

async function showAnnouncementFeed (req,res) {
    const announcements = await getAllOpenAnnouncements()
    res.render("requests/feed", { title: "Annonces — AZÔÔDIÉ", announcements });
}
module.exports = { showContactForm, submitRequest, showJobLeads, showAnnouncementFeed };