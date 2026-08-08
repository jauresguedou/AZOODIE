const { createRequest } = require("../models/request-model");
const { getProfessionalById } = require("../models/professional-model");




async function showContactForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    res.render("requests/contact-form",  { professional  });
}


async function submitRequest(req, res) {
    const newRequest = await createRequest( {
       client_id: 1,
       category: req.body.category,
       description: req.body.description,
       address_text: req.body.address_text,
       lat: req.body.lat,
       lng: req.body.lng,
       budget_estimate: req.body.estimate,
    })
    res.redirect(`/professionals/${ req.body.professional_id }`);

}

module.exports = { showContactForm, submitRequest };