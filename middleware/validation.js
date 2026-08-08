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

const checkValidation = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).render("professionals/add-form", {
           errors: errors.array(), 
        });
    }
    next();
};

module.exports = { professionalValidationRules, checkValidation};