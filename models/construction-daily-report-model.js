
const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

/**
 * Get daily reports if the user can access the project.
 * Owners, site managers, and viewers can read reports.
 * Returns null when the project is not accessible.
 */
async function getReportsForProject(projectId, userId) {
    const accessResult = await pool.query(
        `
        SELECT p.id
        FROM construction_projects AS p
        WHERE p.id = $1
          AND (
              p.owner_id = $2
              OR EXISTS (
                  SELECT 1
                  FROM construction_project_members AS m
                  WHERE m.project_id = p.id
                    AND m.user_id = $2
                    AND m.invitation_status = 'accepted'
              )
          )
        `,
        [projectId, userId]
    );

    if (accessResult.rows.length === 0) {
        return null;
    }

    const result = await pool.query(
        `
        SELECT
            id,
            project_id,
            author_id,
            report_date,
            work_completed,
            workers_count,
            materials_used,
            difficulties,
            notes,
            progress_percentage,
            created_at,
            updated_at
        FROM construction_daily_reports
        WHERE project_id = $1
        ORDER BY report_date DESC, id DESC
        `,
        [projectId]
    );

    const reports = result.rows;

    if (reports.length === 0) {
        return reports;
    }

    const reportIds = reports.map((report) => report.id);

    const mediaResult = await pool.query(
        `
        SELECT
            id,
            report_id,
            media_url,
            public_id,
            media_type,
            created_at
        FROM construction_daily_report_media
        WHERE report_id = ANY($1::int[])
        ORDER BY created_at ASC, id ASC
        `,
        [reportIds]
    );

    const mediaByReport = new Map(
        reports.map((report) => [report.id, []])
    );

    for (const media of mediaResult.rows) {
        const reportMedia = mediaByReport.get(media.report_id);

        if (reportMedia) {
            reportMedia.push(media);
        }
    }

    return reports.map((report) => ({
        ...report,
        media: mediaByReport.get(report.id) || []
    }));
}

/**
 * Create a daily report, save its media references, and update
 * project progress within one SQL transaction.
 *
 * Only the owner or an assigned site manager can create reports.
 * Returns null when the user is not authorized.
 */
async function createDailyReportWithMedia(report, media = []) {
    return withTransaction(pool, async (client) => {
        const result = await client.query(
            `
            INSERT INTO construction_daily_reports (
                project_id,
                author_id,
                report_date,
                work_completed,
                workers_count,
                materials_used,
                difficulties,
                notes,
                progress_percentage
            )
            SELECT
                p.id,
                $2,
                COALESCE($3::date, CURRENT_DATE),
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            FROM construction_projects AS p
            WHERE p.id = $1
              AND (
                  p.owner_id = $2
                  OR EXISTS (
                      SELECT 1
                      FROM construction_project_members AS m
                      WHERE m.project_id = p.id
                        AND m.user_id = $2
                        AND m.member_role = 'site_manager'
                        AND m.invitation_status = 'accepted'
                  )
              )
            RETURNING *
            `,
            [
                report.projectId,
                report.userId,
                report.reportDate || null,
                report.workCompleted,
                report.workersCount ?? null,
                report.materialsUsed || null,
                report.difficulties || null,
                report.notes || null,
                report.progressPercentage
            ]
        );

        const savedReport = result.rows[0];

        if (!savedReport) {
            return null;
        }

        // Keep the project's progress synchronized with this report.
        const progressUpdate = await client.query(
            `
            UPDATE construction_projects
            SET
                progress_percentage = $2,
                status = CASE
                    WHEN $2 = 0 THEN 'planning'
                    WHEN $2 = 100 THEN 'completed'
                    ELSE 'in_progress'
                END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id
            `,
            [report.projectId, report.progressPercentage]
        );
        if (progressUpdate.rowCount !== 1) {
            throw new Error(
                "Impossible de mettre à jour l'avancement du chantier."
            );
        }

        // Save the media references in the same transaction.
        for (const item of media) {
            await client.query(
                `
                INSERT INTO construction_daily_report_media (
                    report_id,
                    media_url,
                    public_id,
                    media_type
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    savedReport.id,
                    item.mediaUrl,
                    item.publicId,
                    item.mediaType
                ]
            );
        }

        return savedReport;
    });
}

async function createDailyReport(report) {
    return createDailyReportWithMedia(report, []);
}

module.exports = {
    createDailyReportWithMedia,
    getReportsForProject,
    createDailyReport
};
