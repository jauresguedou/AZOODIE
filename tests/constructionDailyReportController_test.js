jest.mock("../config/cloudinary", () => ({}));

jest.mock("../models/construction-project-model", () => ({
    getProjectForUser: jest.fn(),
}));

jest.mock("../models/construction-daily-report-model", () => ({
    getReportsForProject: jest.fn(),
    createDailyReportWithMedia: jest.fn(),
    createDailyReport: jest.fn(),
}));

jest.mock("../utils/cloudinaryMediaCleanup", () =>
    jest.fn().mockResolvedValue(undefined)
);

const constructionProjectModel = require("../models/construction-project-model");
const dailyReportModel = require("../models/construction-daily-report-model");
const cleanupCloudinaryMedia = require("../utils/cloudinaryMediaCleanup");

const {
    createDailyReport,
    renderDailyReportUploadError,
} = require("../controllers/constructionDailyReportController");

const project = {
    id: 7,
    title: "Chantier de test",
    access_role: "owner",
};

function makeRequest(overrides = {}) {
    return {
        params: { projectId: "7" },
        session: { userId: 42 },
        body: {
            report_date: "2026-10-22",
            work_completed: "Fondations réalisées",
            workers_count: "3",
            materials_used: "Ciment et sable",
            difficulties: "",
            notes: "",
        },
        files: {
            photos: [
                {
                    public_id: "azoodie/construction-reports/photo-test",
                    secure_url: "https://example.com/photo-test.jpg",
                },
            ],
            videos: [],
        },
        ...overrides,
    };
}

function makeResponse() {
    const res = {
        status: jest.fn(),
        render: jest.fn(),
        send: jest.fn(),
        redirect: jest.fn(),
    };

    res.status.mockReturnValue(res);
    res.render.mockReturnValue(res);
    res.send.mockReturnValue(res);
    res.redirect.mockReturnValue(res);

    return res;
}

describe("constructionDailyReportController — création de rapport", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        constructionProjectModel.getProjectForUser.mockResolvedValue(project);
        cleanupCloudinaryMedia.mockResolvedValue(undefined);
    });

    test("nettoie les médias lorsque le formulaire est invalide", async () => {
        const req = makeRequest({
            body: {
                report_date: "date-invalide",
                work_completed: "",
            },
        });
        const res = makeResponse();

        await createDailyReport(req, res);

        expect(cleanupCloudinaryMedia).toHaveBeenCalledWith(
            req.files,
            expect.anything()
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith(
            "chantiers/report-new",
            expect.objectContaining({
                project,
                errors: expect.arrayContaining([
                    "Indiquez une date de rapport valide.",
                    "Décrivez les travaux réalisés.",
                ]),
            })
        );

        expect(dailyReportModel.createDailyReportWithMedia)
            .not.toHaveBeenCalled();
    });

    test("nettoie les médias et propage l'erreur si la base de données échoue", async () => {
        const req = makeRequest();
        const res = makeResponse();
        const databaseError = new Error("Échec simulé de la base de données");

        dailyReportModel.createDailyReportWithMedia
            .mockRejectedValue(databaseError);

        await expect(createDailyReport(req, res)).rejects.toBe(databaseError);

        expect(cleanupCloudinaryMedia).toHaveBeenCalledWith(
            req.files,
            expect.anything()
        );
    });

    test("enregistre le rapport et redirige sans supprimer les médias", async () => {
        const req = makeRequest();
        const res = makeResponse();

        dailyReportModel.createDailyReportWithMedia.mockResolvedValue({
            id: 101,
        });

        await createDailyReport(req, res);

        expect(dailyReportModel.createDailyReportWithMedia)
            .toHaveBeenCalledWith(
                {
                    projectId: 7,
                    userId: 42,
                    reportDate: "2026-10-22",
                    workCompleted: "Fondations réalisées",
                    workersCount: 3,
                    materialsUsed: "Ciment et sable",
                    difficulties: "",
                    notes: "",
                },
                [
                    {
                        publicId:
                            "azoodie/construction-reports/photo-test",
                        mediaUrl: "https://example.com/photo-test.jpg",
                        mediaType: "image",
                    },
                ]
            );

        expect(res.redirect).toHaveBeenCalledWith(
            "/chantiers/7/rapports"
        );

        expect(cleanupCloudinaryMedia).not.toHaveBeenCalled();
    });

    test("nettoie les médias si le rôle ne permet pas de créer un rapport", async () => {
        const req = makeRequest();
        const res = makeResponse();

        constructionProjectModel.getProjectForUser.mockResolvedValue({
            ...project,
            access_role: "viewer",
        });

        await createDailyReport(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(cleanupCloudinaryMedia).toHaveBeenCalledWith(
            req.files,
            expect.anything()
        );

        expect(dailyReportModel.createDailyReportWithMedia)
            .not.toHaveBeenCalled();
    });

    test("nettoie les médias si les informations d'une photo sont incomplètes", async () => {
        const req = makeRequest({
            files: {
                photos: [{ public_id: "photo-sans-url" }],
                videos: [],
            },
        });
        const res = makeResponse();

        await expect(createDailyReport(req, res)).rejects.toThrow(
            "Impossible de récupérer les informations d'une photo téléversée."
        );

        expect(cleanupCloudinaryMedia).toHaveBeenCalledWith(
            req.files,
            expect.anything()
        );

        expect(dailyReportModel.createDailyReportWithMedia)
            .not.toHaveBeenCalled();
    });


    
    test("affiche le message précis pour un format de fichier non autorisé", async () => {
        const req = makeRequest({
            files: {},
            body: {
                report_date: "2026-10-22",
                work_completed: "Fondations réalisées",
            },
        });
        const res = makeResponse();

        await renderDailyReportUploadError(req, res, {
            message:
                "Format non autorisé. Photos : JPEG, PNG ou WebP. " +
                "Vidéos : MP4, WebM ou MOV.",
            status: 400,
            expose: true,
        });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith(
            "chantiers/report-new",
            expect.objectContaining({
                project,
                errors: [
                    "Format non autorisé. Photos : JPEG, PNG ou WebP. " +
                    "Vidéos : MP4, WebM ou MOV.",
                ],
            })
        );
    });

});
