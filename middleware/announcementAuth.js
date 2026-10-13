function requireAnnouncementAuthor(req, res, next) {
    const role = req.session.userRole;
    if (
        !req.session.userId ||
        ! ["client", "professional"].includes(role)
    ) {
        return res.status(403).send(
            "Connectez-vous avec un compte client ou professionnel pour publier une annonce."
        );
    }

    next();
}
module.exports = { requireAnnouncementAuthor };