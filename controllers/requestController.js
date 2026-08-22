const { createRequest, getNearbyRequestsForProfessional } = require("../models/request-model");
const { getProfessionalById } = require("../models/professional-model");




async function showContactForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    res.render("requests/contact-form",  { professional, errors:[]  });
}


async function submitRequest(req, res) {
    const newRequest = await createRequest( {
       client_id: req.session.userId,
       category: req.body.category,
       description: req.body.description,
       address_text: req.body.address_text,
       lat: req.body.lat,
       lng: req.body.lng,
       budget_estimate: req.body.budget_estimate,
    })
    res.redirect(`/professionals/${ req.body.professional_id }`);

}

async function showJobLeads(req, res) {
    if (!req.session.professionalId) {
        return res.status(403).send("Cette page est réservée aux professionals ayant un profil.");
    }

    const professional = await getProfessionalById(req.session.professionalId);
    const leads = await getNearbyRequestsForProfessional(
        professional.base_lat,
        professional.base_lng,
        professional.service_radius_km

    );

    res.render("professionals/leads", { professional, leads });
}

module.exports = { showContactForm, submitRequest, showJobLeads };