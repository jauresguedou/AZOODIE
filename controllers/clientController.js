const {getUserById, updateUserPhoto } = require("../models/user-model");
const { getRequestsByClient } = require("../models/request-model");
const { getProfessionalById } = require("../models/professional-model");



async function showMyProfile(req, res){
    if (req.session.userRole === "professional") {
        if (!req.session.professionalId) {
            return res.redirect("/professionals/add");
        }

        const professional = await getProfessionalById(req.session.professionalId);
        if (!professional) {
            req.session.professionalId = null;
            await new Promise((resolve, reject) => {
                req.session.save((error) => error ? reject(error) : resolve());
            });
            return res.redirect("/professionals/add");
        }

        return res.redirect(`/professionals/${professional.id}`);
    }

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