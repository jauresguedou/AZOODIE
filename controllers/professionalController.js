const {getAllProfessionals, createProfessional, getNearbyProfessionals, getProfessionalById} = require("../models/professional-model");
const { isFavorited } = require("../models/favorite-model");

async function listProfessionals(req, res) {
    const professionals = await getAllProfessionals();
    res.render("professionals/list", { professionals });
}



async function addProfessional (req, res) {

    const newProfessional = await createProfessional(req.body);
    res.redirect("/professionals");
}



function showAddForm(req,res) {
    res.render("professionals/add-form");
}


async function searchNearby(req, res) {
    
    const { lat , lng } = req.query;

    if(!lat || !lng) {
        return res.render("search/results", { professionals: [], searched: false, lat: null, lng: null });
    }

    const professionals = await getNearbyProfessionals(parseFloat(lat), parseFloat(lng));
    res.render("search/results", { professionals, searched: true, lat: parseFloat(lat), lng: parseFloat(lng) });



}


async function showProfile(req,res) {
    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }
    const favorited = await isFavorited(1, professional.id);
    res.render("professionals/profile", { professional, favorited });
}


  
module.exports = { listProfessionals, addProfessional, showAddForm, searchNearby, showProfile };