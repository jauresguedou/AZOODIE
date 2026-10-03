const pool = require("../config/database");

async function getPublishedAnnouncements(userId = null) {
    const result = await pool.query(
        `SELECT a.*,
                COALESCE(u.name, a.author_label) AS author_name,
                u.photo_url AS author_photo,
                (SELECT COUNT(*)::integer FROM announcement_likes l WHERE l.announcement_id = a.id) AS like_count,
                (SELECT COUNT(*)::integer FROM announcement_comments c WHERE c.announcement_id = a.id) AS comment_count,
                CASE WHEN $1::integer IS NULL THEN FALSE
                     ELSE EXISTS (
                         SELECT 1 FROM announcement_likes l
                         WHERE l.announcement_id = a.id AND l.user_id = $1
                     )
                END AS liked_by_viewer
         FROM announcements a
         LEFT JOIN users u ON u.id = a.author_id
         WHERE a.status = 'published'
         ORDER BY a.is_demo DESC, a.created_at DESC, a.id DESC`,
        [userId]
    );
    return result.rows;
}

async function getAnnouncementComments(announcementIds) {
    if (!announcementIds.length) return [];
    const result = await pool.query(
        `SELECT c.id, c.announcement_id, c.body, c.created_at, u.name AS author_name
         FROM announcement_comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.announcement_id = ANY($1::integer[])
         ORDER BY c.created_at ASC, c.id ASC`,
        [announcementIds]
    );
    return result.rows;
}

async function getClientDrafts(userId) {
    const result = await pool.query(
        `SELECT id, title, category, description, address_text, media_url, media_type, updated_at
         FROM announcements
         WHERE author_id = $1 AND status = 'draft'
         ORDER BY updated_at DESC, id DESC`,
        [userId]
    );
    return result.rows;
}

async function createAnnouncement(data) {
    const result = await pool.query(
        `INSERT INTO announcements
            (author_id, title, category, description, address_text, media_url, media_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, status`,
        [
            data.authorId,
            data.title,
            data.category,
            data.description,
            data.addressText || null,
            data.mediaUrl || null,
            data.mediaType || null,
            data.status,
        ]
    );
    return result.rows[0];
}

async function publishClientDraft(userId, announcementId) {
    const result = await pool.query(
        `UPDATE announcements
         SET status = 'published', updated_at = NOW()
         WHERE id = $1 AND author_id = $2 AND status = 'draft'
         RETURNING id`,
        [announcementId, userId]
    );
    return result.rowCount;
}

async function deleteClientDraft(userId, announcementId) {
    const result = await pool.query(
        `DELETE FROM announcements
         WHERE id = $1 AND author_id = $2 AND status = 'draft'`,
        [announcementId, userId]
    );
    return result.rowCount;
}

async function toggleAnnouncementLike(userId, announcementId) {
    const target = await pool.query(
        "SELECT id FROM announcements WHERE id = $1 AND status = 'published'",
        [announcementId]
    );
    if (!target.rowCount) return { exists: false, liked: false };

    const removed = await pool.query(
        `DELETE FROM announcement_likes
         WHERE announcement_id = $1 AND user_id = $2
         RETURNING announcement_id`,
        [announcementId, userId]
    );
    if (removed.rowCount) return { exists: true, liked: false };

    const added = await pool.query(
        `INSERT INTO announcement_likes (announcement_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING announcement_id`,
        [announcementId, userId]
    );
    return { exists: true, liked: added.rowCount > 0 };
}

async function addAnnouncementComment(userId, announcementId, body) {
    const result = await pool.query(
        `INSERT INTO announcement_comments (announcement_id, user_id, body)
         SELECT a.id, $2, $3
         FROM announcements a
         WHERE a.id = $1 AND a.status = 'published'
         RETURNING id`,
        [announcementId, userId, body]
    );
    return result.rowCount;
}

module.exports = {
    getPublishedAnnouncements,
    getAnnouncementComments,
    getClientDrafts,
    createAnnouncement,
    publishClientDraft,
    deleteClientDraft,
    toggleAnnouncementLike,
    addAnnouncementComment,
};
