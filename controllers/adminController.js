
const { getCoverageSummary, getAdminDashboardSummary } = require("../models/admin-model");

const {
    getVerificationRequestsForAdmin,
    getVerificationDocumentsForAdmin,
    reviewVerificationRequest,
} = require("../models/supplier-verification-model");

const { createSupplierVerificationDocumentUrl } = require("../utils/supplierVerificationDocumentUrl");

async function showAdminDashboard(req, res) {
    const summary = await getAdminDashboardSummary();

    res.render("admin/dashboard", {
        title: "Administration - AZÔÔDIÉ",
        summary,
    })
}

async function showCoverageDashboard(req, res) {
    const zones = await getCoverageSummary();

    res.render("admin/coverage", {
        title: "Couverture géographique — AZÔÔDIÉ",
        zones,
    });
}

async function showSupplierVerifications(req, res) {
    const requests = await getVerificationRequestsForAdmin();

    const requestsWithDocuments = await Promise.all(
        requests.map(async (request) => {
            const documents = await getVerificationDocumentsForAdmin(
                request.id
            );

            return {
                ...request,
                documents: documents.map((document) => ({
                    id: document.id,
                    format: document.format,
                })),
            };
        })
    );

    res.render("admin/supplier-verifications", {
        title: "Vérification des fournisseurs — AZÔÔDIÉ",
        requests: requestsWithDocuments,
    });
}

async function reviewSupplierVerification(req, res) {
    const requestId = Number(req.params.id);
    const adminId = req.session.userId;
    const { status, notes } = req.body;

    if (!Number.isSafeInteger(requestId) || requestId < 1) {
        return res.status(400).send("Identifiant de demande invalide.");
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).send("Décision de vérification invalide.");
    }

    const result = await reviewVerificationRequest(
        requestId,
        adminId,
        status,
        typeof notes === "string" ? notes.trim().slice(0, 2000) || null : null
    );

    if (result.status === "not_found") {
        return res.status(404).send("Demande introuvable.");
    }

    if (result.status === "already_reviewed") {
        return res.status(409).send("Cette demande a déjà été traitée.");
    }

    return res.redirect("/admin/supplier-verifications");
}

async function showSupplierVerificationDocument(req, res) {
    const requestId = Number(req.params.id);
    const documentId = Number(req.params.documentId);

    if (
        !Number.isSafeInteger(requestId) || requestId < 1 ||
        !Number.isSafeInteger(documentId) || documentId < 1
    ) {
        return res.status(400).send("Identifiant de document invalide.");
    }

    const documents = await getVerificationDocumentsForAdmin(requestId);
    const document = documents.find((item) => Number(item.id) === documentId);

    if (!document) {
        return res.status(404).send("Document introuvable.");
    }

    const url = createSupplierVerificationDocumentUrl({
        publicId: document.public_id,
        format: document.format,
    });

    return res.redirect(url);
}

module.exports = {
    showAdminDashboard,
    showCoverageDashboard,
    showSupplierVerifications,
    reviewSupplierVerification,
    showSupplierVerificationDocument,
};
