const {getUserById, updateUserPhoto } = require("../models/user-model");
const { getRequestsByClient } = require("../models/request-model");



async function showMyProfile(req, res){

    console.log("SESSION:", req.session);
    console.log("SESSION USER ID:", req.session.userId);
    const user = await getUserById(req.session.userId);
    console.log("USER FROM DATABASE:", user);
    const announcements = await getRequestsByClient(req.session.userId);
    res.render("clients/profile", { user, announcements });
}

async function uploadMyPhoto(req, res) {
    if (req.file) {
        await updateUserPhoto(req.session.userId, req.file.secure_url);
        req.session.userPhoto = req.file.secure_url;
    }
    res.redirect("/profile");

}

module.exports = { showMyProfile, uploadMyPhoto};