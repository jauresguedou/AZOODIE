const pool = require("../config/database");

/**
 * Invite an existing user to a project owned by the inviter.
 * A revoked membership can be reactivated as a new pending invitation.
 * Returns null if the project, owner, or user does not match,
 * or if an invitation/member is already pending or accepted.
 */
async function createInvitation(ownerId, projectId, email, memberRole) {
    if (!["site_manager", "viewer"].includes(memberRole)) {
        throw new Error("Invalid construction project member role.");
    }

    const result = await pool.query(
        `
        INSERT INTO construction_project_members (
            project_id,
            user_id,
            member_role,
            invited_by,
            invitation_status,
            accepted_at
        )
        SELECT
            p.id,
            u.id,
            $4,
            $1,
            'pending',
            NULL
        FROM construction_projects AS p
        JOIN users AS u
            ON LOWER(TRIM(u.email)) = LOWER(TRIM($3))
        WHERE p.id = $2
          AND p.owner_id = $1
        ON CONFLICT (project_id, user_id)
        DO UPDATE SET
            member_role = EXCLUDED.member_role,
            invited_by = EXCLUDED.invited_by,
            invitation_status = 'pending',
            accepted_at = NULL,
            created_at = NOW()
        WHERE construction_project_members.invitation_status IN ('revoked', 'declined')
        RETURNING
            id,
            project_id,
            user_id,
            member_role,
            invitation_status,
            invited_by,
            created_at
        `,
        [ownerId, projectId, email, memberRole]
    );

    return result.rows[0] || null;
}

/**
 * List pending invitations for the authenticated recipient.
 */
async function getPendingInvitations(userId) {
    const result = await pool.query(
        `
        SELECT
            m.id AS membership_id,
            m.project_id,
            m.member_role,
            m.invitation_status,
            m.created_at AS invited_at,
            p.title AS project_title,
            p.address_text,
            u.name AS owner_name,
            u.email AS owner_email
        FROM construction_project_members AS m
        JOIN construction_projects AS p
            ON p.id = m.project_id
        JOIN users AS u
            ON u.id = p.owner_id
        WHERE m.user_id = $1
          AND m.invitation_status = 'pending'
        ORDER BY m.created_at DESC, m.id DESC
        `,
        [userId]
    );

    return result.rows;
}

/**
 * Accept or decline a pending invitation.
 * A declined invitation is distinct from an owner-revoked membership.
 */
async function respondToInvitation(membershipId, userId, decision) {
    if (!["accepted", "declined"].includes(decision)) {
        throw new Error("Invalid invitation decision.");
    }

    const result = await pool.query(
        `
        UPDATE construction_project_members
        SET
            invitation_status = $3,
            accepted_at = CASE
                WHEN $3 = 'accepted' THEN NOW()
                ELSE NULL
            END
        WHERE id = $1
          AND user_id = $2
          AND invitation_status = 'pending'
        RETURNING
            id,
            project_id,
            user_id,
            member_role,
            invitation_status,
            accepted_at
        `,
        [membershipId, userId, decision]
    );

    return result.rows[0] || null;
}

/**
 * Revoke a member's access. Only the project owner can do this.
 */
async function revokeMember(ownerId, projectId, membershipId) {
    const result = await pool.query(
        `
        UPDATE construction_project_members AS m
        SET
            invitation_status = 'revoked',
            accepted_at = NULL
        FROM construction_projects AS p
        WHERE m.project_id = p.id
          AND p.id = $2
          AND p.owner_id = $1
          AND m.id = $3
          AND m.invitation_status IN ('pending', 'accepted')
        RETURNING
            m.id,
            m.project_id,
            m.user_id,
            m.member_role,
            m.invitation_status
        `,
        [ownerId, projectId, membershipId]
    );

    return result.rows[0] || null;
}

/**
 * List members and invitation states for the project owner.
 */
async function getProjectMembers(ownerId, projectId) {
    const result = await pool.query(
        `
        SELECT
            m.id AS membership_id,
            m.user_id,
            u.name,
            u.email,
            m.member_role,
            m.invitation_status,
            m.invited_by,
            m.created_at,
            m.accepted_at
        FROM construction_project_members AS m
        JOIN construction_projects AS p
            ON p.id = m.project_id
        JOIN users AS u
            ON u.id = m.user_id
        WHERE p.id = $2
          AND p.owner_id = $1
        ORDER BY m.created_at DESC, m.id DESC
        `,
        [ownerId, projectId]
    );

    return result.rows;
}

module.exports = {
    createInvitation,
    getPendingInvitations,
    respondToInvitation,
    revokeMember,
    getProjectMembers
};
