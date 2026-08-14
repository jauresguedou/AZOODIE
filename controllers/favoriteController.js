const { addFavorite, removeFavorite, getFavoritesByClient} = require("../models/favorite-model");

const TEMP_CLIENT_ID = 1;

async function toggleFavorite(req, res) {
     
    const professionalId = req.params.id;
    const action = req.body.action;

    if(action === "remove") {

        await removeFavorite(req.session.userId, professionalId);
    }else {
        await addFavorite(req.session.userId, professionalId);
    }

    res.redirect(req.get("Referer") || "/professionals");

}

async function listFavorites(req, res) {

    const favorites = await getFavoritesByClient(req.session.userId);
    res.render("professionals/favorites", { favorites });
}

module.exports = { toggleFavorite, listFavorites };