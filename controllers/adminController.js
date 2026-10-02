const { getCoverageSummary } = require("../models/admin-model");

async function showCoverageDashboard(req, res) {
    const zones = await getCoverageSummary();

    res.render("admin/coverage", { title: "Couverture géographique — AZÔÔDIÉ", zones });
}

module.exports = { showCoverageDashboard };