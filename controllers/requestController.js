const { createRequest, getNearbyRequestsForProfessional } = require("../models/request-model");
const { getProfessionalById, getUsersToNotifyForRequest } = require("../models/professional-model");
const { createNotification} = require("../models/notification-model");
const { getNotificationsForUser, markAllAsRead } = require("../models/notification-model");
const {getAllOpenAnnouncements} = require("../models/request-model");




async function showContactForm(req, res) {

    const professional = await getProfessionalById(req.params.id);

    if(!professional) {
        return res.status(404).send("Professionnel introuvable.");
    }

    res.render("requests/contact-form",  { professional, errors:[]  });
}


async function submitRequest(req, res) {
    const newRequest = await createRequest( {
       client_id: req.session.userId,
       category: req.body.category,
       description: req.body.description,
       address_text: req.body.address_text,
       lat: req.body.lat,
       lng: req.body.lng,
       budget_estimate: req.body.budget_estimate,
    })
    res.redirect(`/professionals/${ req.body.professional_id }`);

}

async function showJobLeads(req, res) {
    if (!req.session.professionalId) {
        return res.status(403).send("Cette page est réservée aux professionals ayant un profil.");
    }

    console.log("session.professionalId:", req.session.professionalId, typeof req.session.professionalId);

    const professional = await getProfessionalById(req.session.professionalId);

    console.log("professional found:", professional);
    const leads = await getNearbyRequestsForProfessional(
        professional.base_lat,
        professional.base_lng,
        professional.service_radius_km

    );

    res.render("professionals/leads", { professional, leads });
}

async function submitRequest(req, res) {
    const newRequest = await createRequest({
        client_id: req.session.userId,
        category: req.body.category,
        description: req.body.description,
        address_text: req.body.address_text,
        lat: req.body.lat,
        lng: req.body.lng,
        budget_estimate: req.body.budget_estimate,
    });

    const usersToNotify = await getUsersToNotifyForRequest(req.body.lat, req.body.lng);

    for (const user of usersToNotify) {
        await createNotification(
            user.user_id,
            `Nouvelle demande "${req.body.category}" près de vous`,
            "/professionals/leads"
        );
    }
    res.redirect(`/professionals/${req.body.professional_id}`);
}

async function showNotifications(req, res) {
    const notifications = await getNotificationsForUser(req.session.userId);
    await markAllAsRead(req.session.userId);
    res.render("professionals/notifications", { notifications });
}

async function showAnnouncementFeed (req,res) {
    const announcements = await getAllOpenAnnouncements()
    res.render("requests/feed", { announcements });
}
module.exports = { showContactForm, submitRequest, showJobLeads, showNotifications, showAnnouncementFeed };