const { getNotificationsForUser, markAllAsRead } = require("../models/notification-model");

async function showNotifications(req, res) {
    const userId = req.session.userId;
    const notifications = await getNotificationsForUser(userId);

    await markAllAsRead(userId);
    res.render("professionals/notifications", {
        title: "Notifications — AZÔÔDIÉ",
        notifications,
    });
}

module.exports = { showNotifications };
