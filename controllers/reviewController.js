const { hasContactedProfessional, getOwnReview, upsertReview, getReviewsForProfessional } = require("../models/review-model");
const { getProfessionalById } = require("../models/professional-model");

async function showReviewForm(req, res) {
  if (req.session.userRole !== "client") {
    return res.status(403).send("Seuls les clients peuvent laisser un avis.");
  }

  const professional = await getProfessionalById(req.params.id);
  if (!professional) {
    return res.status(404).send("Professionnel introuvable.");
  }

  const eligible = await hasContactedProfessional(req.session.userId, req.params.id);
  if (!eligible) {
    return res.status(403).send("Vous devez avoir contacté ce professionnel avant de laisser un avis.");
  }

  const existingReview = await getOwnReview(req.session.userId, req.params.id);
  res.render("professionals/review-form", { professional, existingReview, errors: [] });
}

async function submitReview(req, res) {
  const rating = parseInt(req.body.rating, 10);
  const comment = (req.body.comment || "").trim();

  const errors = [];
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Choisissez une note entre 1 et 5 étoiles.");
  }
  if (comment.length > 1000) {
    errors.push("Le commentaire ne peut pas dépasser 1000 caractères.");
  }

  const eligible = await hasContactedProfessional(req.session.userId, req.params.id);
  if (!eligible) {
    return res.status(403).send("Vous devez avoir contacté ce professionnel avant de laisser un avis.");
  }

  if (errors.length) {
    const professional = await getProfessionalById(req.params.id);
    const existingReview = await getOwnReview(req.session.userId, req.params.id);
    return res.status(400).render("professionals/review-form", { professional, existingReview, errors });
  }

  await upsertReview(req.session.userId, req.params.id, rating, comment || null);
  res.redirect(`/professionals/${req.params.id}`);
}

module.exports = { showReviewForm, submitReview };