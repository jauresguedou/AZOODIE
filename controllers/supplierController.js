const {
    getSupplierByUserId,
    createSupplier
} = require("../models/supplier-model");

const {
    getLatestVerificationRequest,
    submitVerificationRequest: createVerificationRequest
} = require("../models/supplier-verification-model");

const cleanupSupplierVerificationAssets = require("../utils/cleanupSupplierVerificationAssets");

async function showDashboard(req, res, next) {
    try {
        const supplier = await getSupplierByUserId(req.session.userId);

        if (!supplier) {
            return res.redirect("/supplier/register");
        }

        const verificationRequest = await getLatestVerificationRequest(
            supplier.id
        );

        res.render("suppliers/dashboard", {
            title: "Espace fournisseur — AZÔÔDIÉ",
            supplier,
            verificationRequest
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

async function showVerificationForm(req, res, next) {
    try {
        const supplier = await getSupplierByUserId(req.session.userId);

        if (!supplier) {
            return res.redirect("/supplier/register");
        }

        const verificationRequest = await getLatestVerificationRequest(
            supplier.id
        );

        res.render("suppliers/verification", {
            title: "Vérification du fournisseur — AZÔÔDIÉ",
            supplier,
            verificationRequest,
            errors: []
        });
    } catch (error) {
        next(error);
    }
}

async function ensureCanSubmitVerification(req, res, next) {
    try {
        const supplier = await getSupplierByUserId(req.session.userId);

        if (!supplier) {
            return res.redirect("/supplier/register");
        }

        if (supplier.verified) {
            return res.redirect("/supplier/dashboard");
        }

        const verificationRequest = await getLatestVerificationRequest(
            supplier.id
        );

        if (verificationRequest?.status === "pending") {
            return res.redirect("/supplier/dashboard");
        }

        req.supplier = supplier;
        next();
    } catch (error) {
        next(error);
    }
}

async function submitSupplierVerification(req, res, next) {
    const wantsJson = typeof req.get === "function" &&
        (req.get("Accept") || "").includes("application/json");

    const files = Array.isArray(req.files) ? req.files : [];
    let assetsPersisted = false;
    let assetsCleaned = false;

    async function cleanupUploadedAssets() {
        if (assetsPersisted || assetsCleaned) return;
        assetsCleaned = true;
        await cleanupSupplierVerificationAssets(files);
    }

    try {
        if (files.length < 1 || files.length > 3) {
            await cleanupUploadedAssets();

            const message = "Veuillez joindre entre 1 et 3 documents.";

            if (wantsJson) {
                return res.status(400).json({ message });
            }

            const verificationRequest = await getLatestVerificationRequest(
                req.supplier.id
            );

            return res.status(400).render("suppliers/verification", {
                title: "Vérification du fournisseur — AZÔÔDIÉ",
                supplier: req.supplier,
                verificationRequest,
                supplierVerificationCsrfToken:
                    req.session?.supplierVerificationCsrfToken,
                errors: [{ msg: message }]
            });
        }

        const documents = files.map((file) => ({
            public_id: file.public_id,
            format: file.format
        }));

        const result = await createVerificationRequest(
            req.supplier.id,
            documents
        );

        if (!result) {
            await cleanupUploadedAssets();

            const error = new Error(
                "Impossible de soumettre la demande : fournisseur introuvable."
            );
            error.status = 404;
            return next(error);
        }

        if (result.status === "submitted") {
            assetsPersisted = true;
        } else if (
            ["already_verified", "pending"].includes(result.status)
        ) {
            await cleanupUploadedAssets();
        } else {
            throw new Error(
                "Résultat inattendu lors de la soumission de la vérification."
            );
        }

        if (
            ["already_verified", "pending", "submitted"].includes(result.status)
        ) {
            if (wantsJson) {
                return res.status(200).json({
                    redirect: "/supplier/dashboard"
                });
            }

            return res.redirect("/supplier/dashboard");
        }
    } catch (error) {
        await cleanupUploadedAssets();
        return next(error);
    }
}

module.exports = {
    showDashboard,
    showRegistrationForm,
    registerSupplier,
    showVerificationForm,
    ensureCanSubmitVerification,
    submitSupplierVerification
};
