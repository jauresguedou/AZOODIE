const { body, validationResult} = require("express-validator");


const professionalValidationRules = () => {
    return [
        body("name").trim().notEmpty().withMessage("Le nom est requis."),
        body("trade_category").trim().notEmpty().withMessage("Le metier est requis."),
        body("service_radius_km").isFloat({ min:0}).withMessage("Le rayon doit être un nombre positif"),
        body("base_lat").isFloat( { min: -90, max:90}).withMessage("Latitude invalide."),
        body("base_lng").isFloat( { min: -180, max: 180}).withMessage("Longitude invalide"),
    ]
};

const requestValidationRules = () => {
   

    return [
       body("category").trim().notEmpty().withMessage("La catégorie est requise."),
       body("description").trim().notEmpty().withMessage("La description est requise."),
       body("address_text").trim().notEmpty().withMessage("Le lieu du chantier est requis."),
       body("professional_id").isInt({ min: 1 }).withMessage("Le profil professionnel est invalide."),
       body("lat").isFloat({min: -90, max: 90 }).withMessage("Latitude invalide."),
       body("lng").isFloat({ min: -180, max: 180}).withMessage("Longitude invalide."),
       body("budget_estimate").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("Le budget doit être un nombre positif."),
    ]

}

const checkValidation = async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        if (req.baseUrl === "/requests") {
            const { getProfessionalById } = require("../models/professional-model");
            const professional = await getProfessionalById(req.body.professional_id);
            if (!professional) {
                return res.status(404).send("Professionnel introuvable.");
            }
            return res.status(400).render("requests/contact-form", {
                title: `Contacter ${professional.name} — AZÔÔDIÉ`,
                professional,
                errors: errors.array(),
                formValues: req.body,
            });
        }

        if (req.params.id) {
            const { getProfessionalById } = require("../models/professional-model");
            const professional = await getProfessionalById(req.params.id);
            if (!professional) {
                return res.status(404).send("Professionnel introuvable.");
            }
            return res.status(400).render("professionals/edit-form", {
                title: `Modifier ${professional.name} — AZÔÔDIÉ`,
                professional,
                formValues: req.body,
                errors: errors.array(),
            });
        }

        return res.status(400).render("professionals/add-form", {
            title: "Ajouter un professionnel — AZÔÔDIÉ",
            formValues: req.body,
            errors: errors.array(),
        });
    }
    next();
};

module.exports = { professionalValidationRules, checkValidation, requestValidationRules };