const pool = require("../config/database");

async function createNotification(userId, message, link) {
    await pool.query(
         
        "INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3)",
        [userId, message, link]

    );
}

async function getNotificationsForUser(userId) {
    const result = await pool.query(
        " SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
        [userId]
    );
    return result.rows;
}

async function getUnreadCount(userId) {
    const result = await pool.query(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE",
        [userId]
    );
    return parseInt(result.rows[0].count, 10);
}

async function markAllAsRead(userId) {
    await pool.query(
        "UPDATE notifications SET is_read = TRUE  WHERE  user_id = $1 AND is_read = FALSE",
        [userId]
    );
}

module.exports = { createNotification, getNotificationsForUser, getUnreadCount, markAllAsRead}