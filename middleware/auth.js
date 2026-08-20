function requireLogin(req, res, next) {
    if(!req.session.userId) {
        return res.redirect("/login");
    }
    next();


}

function requireProfessionalRole(req, res, next) {

    if(!req.session.userId || req.session.userRole !== "professional") {
        return res.status(403).send("Seuls les professionnels peuvent créer un profil.");

    }

    if (req.session.professionalId) {
        return res.status(400).send("Vous avez déjà un profil professionnel.");
    }

    next();
}

function requireOwnership(req, res, next) {
    const targetId = parseInt(req.params.id, 10);

    if (req.session.professionalId!== targetId) {
        return res.status(403).send("Vous ne pouvez modifier que votre propre profil.")
    }
    next();
}



module.exports = { requireLogin, requireProfessionalRole, requireOwnership };