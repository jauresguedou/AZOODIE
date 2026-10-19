const express = require("express");
const router = express.Router();

const materialModel = require("../models/material-model");

const allowedSortOptions = [
    "price_asc",
    "price_desc",
    "recent"
];




function parsePrice(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && String(value).trim() !== ""
        ? number
        : "";
}

router.get("/", async (req, res, next) => {
    try {



        const requestedSort = (req.query.sort || "price_asc").trim();
        

        const filters = {
            search: (req.query.search || "").trim(),
            department: (req.query.department || "").trim(),
            commune: (req.query.commune || "").trim(),
            sort: allowedSortOptions.includes(requestedSort)
                ? requestedSort
                : "price_asc"
        };

        const offers = await materialModel.getActiveOffers(filters);

        res.render("market/index", {
            title: "Marché | AZÔÔDIÉ",
            offers,
            filters
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;