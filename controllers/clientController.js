const {getUserById, updateUserPhoto } = require("../models/user-model");
const { getRequestsByClient } = require("../models/request-model");



async function showMyProfile(req, res){

    const user = await getUserById(req.session.userId);
    if (!user) {
        return req.session.destroy((error) => {
            if (error) {
                return res.status(500).send("Impossible de restaurer la session utilisateur.");
            }
            return res.redirect("/login");
        });
    }
    const announcements = await getRequestsByClient(req.session.userId);
    res.render("clients/profile", { title: "Mon profil — AZÔÔDIÉ", user, announcements });
}

async function uploadMyPhoto(req, res) {
    if (req.file) {
        await updateUserPhoto(req.session.userId, req.file.secure_url);
        req.session.userPhoto = req.file.secure_url;
    }
    res.redirect("/profile");

}

module.exports = { showMyProfile, uploadMyPhoto};