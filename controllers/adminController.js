const { getCoverageSummary } = require("../models/admin-model");

async function showCoverageDashboard(req, res) {
    const zones = await getCoverageSummary();

    res.render("admin/coverage", {  zones });
}

module.exports = { showCoverageDashboard };