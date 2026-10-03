const {getAllProfessionals, createProfessional, getNearbyProfessionals, getProfessionalById, updateProfessional, deleteProfessional, addPhotoToProfessional, getPortfolioPosts, createPortfolioPost, deletePortfolioPost} = require("../models/professional-model");
const { getNearbyRequestsForProfessional } = require("../models/request-model");
const { createUser, findUserByEmail } = require("../models/user-model");
const pool = require("../config/database");
const tradeCategories = require("../config/tradeCategories");
const serializeInlineJson = require("../utils/serializeInlineJson");
const withTransaction = require("../utils/withTransaction");

const searchHeadContent = [
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>',
    '<script src="/js/search.js"></script>',
    '<script src="/js/autocomplete.js"></script>',
].join("\n");



async function listProfessionals(req, res) {
    const professionals = await getAllProfessionals();
    res.render("professionals/list", { title: "Professionnels — AZÔÔDIÉ", professionals });
}



async function addProfessional (req, res) {

    const newProfessional = await withTransaction(pool, async (client) => {
        const created = await createProfessional(req.body, client);
        const association = await client.query(
            "UPDATE users SET professional_id = $1 WHERE id = $2",
            [created.id, req.session.userId]
        );
        if (association.rowCount !== 1) {
            throw new Error("Unable to associate the professional profile with its user.");
        }
        return created;
    });
    req.session.professionalId = newProfessional.id;
    res.redirect(`/professionals/${newProfessional.id}`);
}



function showAddForm(req,res) {
    res.render("professionals/add-form", {
        title: "Ajouter un professionnel — AZÔÔDIÉ",
        formValues: {},
    });
}

async function showDashboard(req, res) {
    if (req.session.userRole !== "professional") {
        return res.status(403).send("Cette page est réservée aux professionnels.");
    }

    if (!req.session.professionalId) {
        return res.redirect("/professionals/add");
    }

    const professional = await getProfessionalById(req.session.professionalId);
    if (!professional) {
        req.session.professionalId = null;
        await new Promise((resolve, reject) => {
            req.session.save((error) => error ? reject(error) : resolve());
        });
        return res.redirect("/professionals/add");
    }

    const leads = await getNearbyRequestsForProfessional(
        professional.base_lat,
        professional.base_lng,
        professional.service_radius_km
    );

    res.render("professionals/dashboard", {
        title: `Tableau de bord — ${professional.name}`,
        professional,
        leadCount: leads.length,
        recentLeads: leads.slice(0, 5),
    });
}


async function searchNearby(req, res) {
    
    const { lat , lng, category,minRating, maxDistance, sortBy } = req.query;

    if(!lat || !lng) {
        return res.render("search/results", {
            professionals: [],
            searched: false,
            lat: null,
            lng: null,
            filters: {},
            tradeCategories,
            title: "Recherche — AZÔÔDIÉ",
            headContent: searchHeadContent,
        });
    }

    const professionals = await getNearbyProfessionals(parseFloat(lat), parseFloat(lng), {
       category: category || null,
       minRating: minRating ? parseFloat(minRating) : null,
       maxDistanceKm: maxDistance ? parseFloat(maxDistance) : 25,
       sortBy: sortBy || "distance",

    });
       
    res.render("search/results", {
        professionals,
        searched: true,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        filters: { category, minRating, maxDistance, sortBy },
        tradeCategories,
        title: "Recherche — AZÔÔDIÉ",
        headContent: searchHeadContent,
        searchData: serializeInlineJson({
            clientLat: parseFloat(lat),
            clientLng: parseFloat(lng),
            professionals,
        }),
    });



}


async function showProfile(req,res) {
    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }
    const portfolioPosts = await getPortfolioPosts(professional.id);
    res.render("professionals/profile", {
        title: `${professional.name} — AZÔÔDIÉ`,
        professional,
        portfolioPosts,
    });
}

function validatePortfolioCaption(req, res, next) {
    const body = req.body || {};
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    if (caption.length > 500) {
        return res.status(400).send("La légende ne peut pas dépasser 500 caractères.");
    }
    req.body = { ...body, caption };
    next();
}

async function createPortfolioPostHandler(req, res) {
    if (!req.file) {
        return res.status(400).send("Ajoutez une photo ou une vidéo à votre publication.");
    }

    await createPortfolioPost(req.params.id, {
        caption: (req.body && req.body.caption) || "",
        mediaUrl: req.file.secure_url,
        mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
    });
    res.redirect(`/professionals/${req.params.id}`);
}

async function deletePortfolioPostHandler(req, res) {
    const deletedCount = await deletePortfolioPost(req.params.id, req.params.postId);
    if (deletedCount === 0) {
        return res.status(404).send("Publication introuvable.");
    }
    res.redirect(`/professionals/${req.params.id}`);
}

async function showEditForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
         
        return res.status(404).send("Professionel introuvable.");
    }
    res.render("professionals/edit-form", {
        title: `Modifier ${professional.name} — AZÔÔDIÉ`,
        professional,
        formValues: {},
        errors: [],
    });

}


async function editProfessional(req, res) {
    
    const professional = await updateProfessional(req.params.id, req.body);
    if (!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    if (req.file) {
        await addPhotoToProfessional(req.params.id, req.file.secure_url);
    }
    res.redirect(`/professionals/${req.params.id}`);
}


async function deleteProfessionalHandler(req, res) {
    const deletedCount = await deleteProfessional(req.params.id);
    if (deletedCount === 0) {
        return res.status(404).send("Professionnel introuvable.");
    }
    if (Number(req.session.professionalId) === Number(req.params.id)) {
        req.session.professionalId = null;
        await new Promise((resolve, reject) => {
            req.session.save((error) => error ? reject(error) : resolve());
        });
    }
    res.redirect("/professionals");
}
 


  
module.exports = {
    listProfessionals,
    addProfessional,
    showAddForm,
    showDashboard,
    searchNearby,
    showProfile,
    validatePortfolioCaption,
    createPortfolioPostHandler,
    deletePortfolioPostHandler,
    showEditForm,
    editProfessional,
    deleteProfessionalHandler,
};