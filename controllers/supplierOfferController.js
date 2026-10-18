
const pool = require("../config/database");

const { getSupplierByUserId } = require("../models/supplier-model");
const {
  createOffer,
  getOffersBySupplier
} = require("../models/supplier-offer-model");

async function showOfferForm(req, res, next) {
  try {
    const supplier = await getSupplierByUserId(req.session.userId);

    if (!supplier) {
      return res.redirect("/supplier/register");
    }

    const result = await pool.query(`
      SELECT id, name, category, specification, unit
      FROM materials
      ORDER BY name ASC
    `);

    res.render("suppliers/offers/new", {
      title: "Publier une offre — AZÔÔDIÉ",
      materials: result.rows,
      errors: [],
      formValues: {}
    });
  } catch (error) {
    next(error);
  }
}

async function publishOffer(req, res, next) {
  try {
    const supplier = await getSupplierByUserId(req.session.userId);

    if (!supplier) {
      return res.redirect("/supplier/register");
    }

    const materialId = Number.parseInt(req.body.material_id, 10);
    const price = Number(req.body.price_fcfa);
    const stockQuantity =
      req.body.stock_quantity === "" ||
      req.body.stock_quantity == null
        ? null
        : Number(req.body.stock_quantity);

    const stockStatus = req.body.stock_status;
    const deliveryAvailable = req.body.delivery_available
      ? "true"
      : "false";

    const deliveryDetails =
      typeof req.body.delivery_details === "string"
        ? req.body.delivery_details.trim()
        : "";

    const errors = [];

    if (!Number.isInteger(materialId)) {
      errors.push({ msg: "Veuillez sélectionner un matériau valide." });
    }

    if (!Number.isFinite(price) || price <= 0) {
      errors.push({ msg: "Le prix doit être supérieur à zéro." });
    }

    if (
      stockQuantity !== null &&
      (!Number.isFinite(stockQuantity) || stockQuantity < 0)
    ) {
      errors.push({
        msg: "La quantité en stock doit être un nombre positif ou zéro."
      });
    }

    const allowedStockStatuses = [
      "available",
      "limited",
      "out_of_stock",
      "unknown"
    ];

    if (!allowedStockStatuses.includes(stockStatus)) {
      errors.push({ msg: "Veuillez sélectionner un statut de stock valide." });
    }

    if (deliveryDetails.length > 1000) {
      errors.push({ msg: "Les informations de livraison sont trop longues." });
    }

    const materialsResult = await pool.query(`
      SELECT id, name, category, specification, unit
      FROM materials
      ORDER BY name ASC
    `);

    const materialExists = materialsResult.rows.some(
      (material) => material.id === materialId
    );

    if (Number.isInteger(materialId) && !materialExists) {
      errors.push({ msg: "Le matériau sélectionné n'existe pas." });
    }

    const formValues = {
      material_id: req.body.material_id || "",
      price_fcfa: req.body.price_fcfa || "",
      stock_quantity: req.body.stock_quantity || "",
      stock_status: stockStatus || "unknown",
      delivery_available: Boolean(req.body.delivery_available),
      delivery_details: deliveryDetails
    };

    if (errors.length > 0) {
      return res.status(400).render("suppliers/offers/new", {
        title: "Publier une offre — AZÔÔDIÉ",
        materials: materialsResult.rows,
        errors,
        formValues
      });
    }

    await createOffer(supplier.id, {
      material_id: materialId,
      price_fcfa: price,
      stock_quantity: stockQuantity,
      stock_status: stockStatus,
      delivery_available: deliveryAvailable,
      delivery_details: deliveryDetails
    });

    res.redirect("/supplier/dashboard");
  } catch (error) {
    next(error);
  }
}

async function showSupplierOffers(req, res, next) {
  try {
    const supplier = await getSupplierByUserId(req.session.userId);

    if (!supplier) {
      return res.redirect("/supplier/register");
    }

    const offers = await getOffersBySupplier(supplier.id);

    res.render("suppliers/offers/index", {
      title: "Mes offres — AZÔÔDIÉ",
      supplier,
      offers
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  showOfferForm,
  publishOffer,
  showSupplierOffers
};
