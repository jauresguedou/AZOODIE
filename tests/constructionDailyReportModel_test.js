jest.mock("../config/database", () => ({
    query: jest.fn(),
}));

let mockClient;

jest.mock("../utils/withTransaction", () =>
    jest.fn(async (pool, callback) => {
        mockClient = {
            query: jest.fn()
                .mockResolvedValueOnce({
                    rows: [{ id: 101 }],
                    rowCount: 1,
                })
                .mockResolvedValueOnce({
                    rows: [{ id: 7 }],
                    rowCount: 1,
                }),
        };

        return callback(mockClient);
    })
);

const withTransaction = require("../utils/withTransaction");
const {
    createDailyReportWithMedia,
} = require("../models/construction-daily-report-model");

describe("constructionDailyReportModel — statut automatique", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = null;
    });

    test.each([
        [0, "planning"],
        [50, "in_progress"],
        [100, "completed"],
    ])(
        "met à jour la progression à %s %% et prévoit le statut %s",
        async (percentage, expectedStatus) => {
            await createDailyReportWithMedia(
                {
                    projectId: 7,
                    userId: 42,
                    reportDate: "2026-10-22",
                    workCompleted: "Travaux de test",
                    workersCount: 3,
                    materialsUsed: "Ciment",
                    difficulties: "",
                    notes: "",
                    progressPercentage: percentage,
                },
                []
            );

            expect(withTransaction).toHaveBeenCalledTimes(1);
            expect(mockClient.query).toHaveBeenCalledTimes(2);

            const [updateSql, updateParams] =
                mockClient.query.mock.calls[1];

            expect(updateSql).toContain(
                "UPDATE construction_projects"
            );
            expect(updateSql).toContain("progress_percentage = $2");
            expect(updateSql).toContain("status = CASE");
            expect(updateSql).toContain(
                "WHEN $2 = 0 THEN 'planning'"
            );
            expect(updateSql).toContain(
                "WHEN $2 = 100 THEN 'completed'"
            );
            expect(updateSql).toContain("ELSE 'in_progress'");

            expect(updateParams).toEqual([7, percentage]);

            // Vérifie que le statut attendu correspond à la règle SQL.
            const calculatedStatus =
                percentage === 0
                    ? "planning"
                    : percentage === 100
                        ? "completed"
                        : "in_progress";

            expect(calculatedStatus).toBe(expectedStatus);
        }
    );
});
