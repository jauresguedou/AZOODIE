const {getAllProfessionals, createProfessional, getNearbyProfessionals, getProfessionalById, updateProfessional, deleteProfessional, addPhotoToProfessional} = require("../models/professional-model");
const { isFavorited } = require("../models/favorite-model");
const { createUser, findUserByEmail } = require("../models/user-model");
const pool = require("../config/database");
const tradeCategories = require("../config/tradeCategories");



async function listProfessionals(req, res) {
    const professionals = await getAllProfessionals();
    res.render("professionals/list", { professionals });
}



async function addProfessional (req, res) {

    const newProfessional = await createProfessional(req.body);
     
    await pool.query(


        "UPDATE users SET professional_id = $1 WHERE id = $2",
        [newProfessional.id, req.session.userId]
    );
    req.session.professionalId = newProfessional.id;
    res.redirect(`/professionals/${newProfessional.id}`);
}



function showAddForm(req,res) {
    res.render("professionals/add-form");
}


async function searchNearby(req, res) {
    
    const { lat , lng, category,minRating, maxDistance, sortBy } = req.query;

    if(!lat || !lng) {
        return res.render("search/results", { professionals: [], searched: false, lat: null, lng: null, filters: {}, tradeCategories});
    }

    const professionals = await getNearbyProfessionals(parseFloat(lat), parseFloat(lng), {
       category: category || null,
       minRating: minRating ? parseFloat(minRating) : null,
       maxDistanceKm: maxDistance ? parseFloat(maxDistance) : 25,
       sortBy: sortBy || "distance",

    });
       
    res.render("search/results", { professionals, searched: true, lat: parseFloat(lat), lng: parseFloat(lng), filters: { category, minRating, maxDistance, sortBy}, tradeCategories, });



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
        await addPhotoToProfessional(req.params.id, req.file.secure_url);
    }
    res.redirect(`/professionals/${req.params.id}`);
}


async function deleteProfessionalHandler(req, res) {
    await deleteProfessional(req.params.id);
    res.redirect("/professionals");
}
 


  
module.exports = { listProfessionals, addProfessional, showAddForm, searchNearby, showProfile, showEditForm, editProfessional, deleteProfessionalHandler };