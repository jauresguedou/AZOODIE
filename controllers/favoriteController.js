const { addFavorite, removeFavorite, getFavoritesByClient} = require("../models/favorite-model");

const TEMP_CLIENT_ID = 1;

async function toggleFavorite(req, res) {
     
    const professionalId = req.params.id;
    const action = req.body.action;

    if(action === "remove") {

        await removeFavorite(TEMP_CLIENT_ID, professionalId);
    }else {
        await addFavorite(TEMP_CLIENT_ID, professionalId);
    }

    res.redirect(req.get("Referer") || "/professionals");

}

async function listFavorites(req, res) {

    const favorites = await getFavoritesByClient(TEMP_CLIENT_ID);
    res.render("professionals/favorites", { favorites });
}

module.exports = { toggleFavorite, listFavorites };