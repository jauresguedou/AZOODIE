const { getUsersToNotifyForRequest } = require("../../models/professional-model");
const { createNotification } = require("../../models/notification-model");

async function notifyProfessionalsForRequest(request, database) {
    const users = database
        ? await getUsersToNotifyForRequest(request.lat, request.lng, database)
        : await getUsersToNotifyForRequest(request.lat, request.lng);

    for (const user of users) {
        const notification = [
            user.user_id,
            `Nouvelle demande "${request.category}" près de vous`,
            "/professionals/leads",
        ];
        if (database) {
            await createNotification(...notification, database);
        } else {
            await createNotification(...notification);
        }
    }

    return users.length;
}

module.exports = { notifyProfessionalsForRequest };