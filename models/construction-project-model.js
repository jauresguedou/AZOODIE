const pool = require("../config/database");

/**
 * Return projects owned by the user or shared with them.
 */
async function getProjectsForUser(userId) {
    const result = await pool.query(
        `
        SELECT
            p.id,
            p.owner_id,
            p.title,
            p.description,
            p.address_text,
            p.department,
            p.commune,
            p.budget_estimate,
            p.start_date,
            p.target_end_date,
            p.status,
            p.created_at,
            p.updated_at,
            CASE
                WHEN p.owner_id = $1 THEN 'owner'
                ELSE m.member_role
            END AS access_role
        FROM construction_projects AS p
        LEFT JOIN construction_project_members AS m
            ON m.project_id = p.id
            AND m.user_id = $1
        WHERE p.owner_id = $1
           OR m.user_id = $1
        ORDER BY p.created_at DESC, p.id DESC
        `,
        [userId]
    );

    return result.rows;
}

/**
 * Create a project owned by the authenticated user.
 */
async function createProject(project) {
    const result = await pool.query(
        `
        INSERT INTO construction_projects (
            owner_id,
            title,
            description,
            address_text,
            department,
            commune,
            budget_estimate,
            start_date,
            target_end_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            project.ownerId,
            project.title,
            project.description || null,
            project.addressText,
            project.department || null,
            project.commune || null,
            project.budgetEstimate ?? null,
            project.startDate || null,
            project.targetEndDate || null
        ]
    );

    return result.rows[0];
}

/**
 * Return a project only if the user owns it or is a member.
 */
async function getProjectForUser(projectId, userId) {
    const result = await pool.query(
        `
        SELECT
            p.*,
            CASE
                WHEN p.owner_id = $2 THEN 'owner'
                ELSE m.member_role
            END AS access_role
        FROM construction_projects AS p
        LEFT JOIN construction_project_members AS m
            ON m.project_id = p.id
            AND m.user_id = $2
        WHERE p.id = $1
          AND (
              p.owner_id = $2
              OR m.user_id = $2
          )
        `,
        [projectId, userId]
    );

    return result.rows[0] || null;
}

module.exports = {
    getProjectsForUser,
    createProject,
    getProjectForUser
};
