jest.mock("../config/database", () => ({
    query: jest.fn(),
}));

jest.mock("../utils/withTransaction", () => jest.fn());

const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

const constructionProjectModel =
    require("../models/construction-project-model");

const dailyReportModel =
    require("../models/construction-daily-report-model");

describe("Accès aux chantiers selon le statut de l'invitation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("la liste des chantiers filtre les membres non acceptés", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await constructionProjectModel.getProjectsForUser(42);

        const [sql] = pool.query.mock.calls[0];

        expect(sql).toContain(
            "m.invitation_status = 'accepted'"
        );
    });

    test("un chantier inaccessible retourne null", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const project =
            await constructionProjectModel.getProjectForUser(7, 42);

        expect(project).toBeNull();

        const [sql] = pool.query.mock.calls[0];

        expect(sql).toContain(
            "m.invitation_status = 'accepted'"
        );
    });

    test("les rapports sont refusés si aucun accès accepté n'est trouvé", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const reports =
            await dailyReportModel.getReportsForProject(7, 42);

        expect(reports).toBeNull();
        expect(pool.query).toHaveBeenCalledTimes(1);

        const [sql] = pool.query.mock.calls[0];

        expect(sql).toContain(
            "m.invitation_status = 'accepted'"
        );
    });

    test("la création exige un site_manager avec une invitation acceptée", async () => {
        const client = {
            query: jest.fn().mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
            }),
        };

        withTransaction.mockImplementationOnce(
            async (_pool, callback) => callback(client)
        );

        const result =
            await dailyReportModel.createDailyReportWithMedia(
                {
                    projectId: 7,
                    userId: 42,
                    reportDate: "2026-10-22",
                    workCompleted: "Travaux de test",
                    workersCount: 3,
                    materialsUsed: "Ciment",
                    difficulties: "",
                    notes: "",
                    progressPercentage: 35,
                },
                []
            );

        expect(result).toBeNull();

        const [sql] = client.query.mock.calls[0];

        expect(sql).toContain("m.member_role = 'site_manager'");
        expect(sql).toContain(
            "m.invitation_status = 'accepted'"
        );

        // Aucun rapport non autorisé ne doit mettre à jour la progression.
        expect(client.query).toHaveBeenCalledTimes(1);
    });
});
