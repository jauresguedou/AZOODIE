
const {
    getSupplierByUserId,
    createSupplier
} = require("../models/supplier-model");

async function showDashboard(req, res, next) {
    try {
        const supplier = await getSupplierByUserId(req.session.userId);

        if (!supplier) {
            return res.redirect("/supplier/register");
        }

        res.render("suppliers/dashboard", {
            title: "Espace fournisseur — AZÔÔDIÉ",
            supplier
        });
    } catch (error) {
        next(error);
    }
}

async function showRegistrationForm(req, res, next) {
    try {
        const supplier = await getSupplierByUserId(req.session.userId);

        if (supplier) {
            return res.redirect("/supplier/dashboard");
        }

        res.render("suppliers/register", {
            title: "Inscrire mon entreprise — AZÔÔDIÉ",
            errors: [],
            formValues: {}
        });
    } catch (error) {
        next(error);
    }
}

async function registerSupplier(req, res, next) {
    try {
        const existing = await getSupplierByUserId(req.session.userId);

        if (existing) {
            return res.redirect("/supplier/dashboard");
        }

        const business_name =
            typeof req.body.business_name === "string"
                ? req.body.business_name.trim()
                : "";

        const phone =
            typeof req.body.phone === "string"
                ? req.body.phone.trim()
                : "";

        const description =
            typeof req.body.description === "string"
                ? req.body.description.trim()
                : "";

        const department =
            typeof req.body.department === "string"
                ? req.body.department.trim()
                : "";

        const commune =
            typeof req.body.commune === "string"
                ? req.body.commune.trim()
                : "";

        const address_text =
            typeof req.body.address_text === "string"
                ? req.body.address_text.trim()
                : "";

        const errors = [];

        if (business_name.length < 2 || business_name.length > 150) {
            errors.push({
                msg: "Le nom de l'entreprise doit contenir entre 2 et 150 caractères."
            });
        }

        if (!department || !commune) {
            errors.push({
                msg: "Veuillez renseigner le département et la commune."
            });
        }

        if (phone.length > 30) {
            errors.push({
                msg: "Le numéro de téléphone est trop long."
            });
        }

        if (description.length > 2000 || address_text.length > 500) {
            errors.push({
                msg: "La description ou l'adresse dépasse la longueur autorisée."
            });
        }

        const formValues = {
            business_name,
            phone,
            description,
            department,
            commune,
            address_text
        };

        if (errors.length > 0) {
            return res.status(400).render("suppliers/register", {
                title: "Inscrire mon entreprise — AZÔÔDIÉ",
                errors,
                formValues
            });
        }

        await createSupplier(req.session.userId, formValues);

        res.redirect("/supplier/dashboard");
    } catch (error) {
        if (error.code === "23505") {
            return res.redirect("/supplier/dashboard");
        }

        next(error);
    }
}

module.exports = {
    showDashboard,
    showRegistrationForm,
    registerSupplier
};
