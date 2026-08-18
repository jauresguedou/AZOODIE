const {getAllProfessionals, createProfessional, getNearbyProfessionals, getProfessionalById, updateProfessional, deleteProfessional, addPhotoToProfessional} = require("../models/professional-model");
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
    const favorited = req.session.userId? await isFavorited(req.session.userId, professional.id) : false;
    res.render("professionals/profile", { professional, favorited });
}

async function showEditForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
         
        return res.status(404).send("Professionel introuvable.");
    }
    res.render("professionals/edit-form", {professional, errors: []});

}


async function editProfessional(req, res) {
    
    await updateProfessional(req.params.id, req.body);

    if (req.file) {
        await addPhotoToProfessional(req.params.id, req.file.path);
    }
    res.redirect(`/professionals/${req.params.id}`);
}


async function deleteProfessionalHandler(req, res) {
    await deleteProfessional(req.params.id);
    res.redirect("/professionals");
}



  
module.exports = { listProfessionals, addProfessional, showAddForm, searchNearby, showProfile, showEditForm, editProfessional, deleteProfessionalHandler };