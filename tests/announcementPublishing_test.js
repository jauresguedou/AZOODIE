jest.mock("../models/request-model", () => ({
    createRequest: jest.fn(),
    getNearbyRequestsForProfessional: jest.fn(),
    getAllOpenAnnouncements: jest.fn(),
}));

jest.mock("../models/professional-model", () => ({
    getProfessionalById: jest.fn(),
}));

jest.mock("../services/controllers/matchingService", () => ({
    notifyProfessionalsForRequest: jest.fn(),
}));

jest.mock("../utils/withTransaction", () => jest.fn(async (pool, operation) => operation({})));

const { createRequest, getAllOpenAnnouncements } = require("../models/request-model");
const { notifyProfessionalsForRequest } = require("../services/controllers/matchingService");
const { publishAnnouncement } = require("../controllers/requestController");

describe("client announcement publishing", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        createRequest.mockResolvedValue({});
        notifyProfessionalsForRequest.mockResolvedValue(0);
        getAllOpenAnnouncements.mockResolvedValue([]);
    });

    function response() {
        return {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            render: jest.fn(),
            redirect: jest.fn(),
        };
    }

    test("prevents professionals from publishing client project announcements", async () => {
        const res = response();

        await publishAnnouncement({ session: { userRole: "professional" }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(createRequest).not.toHaveBeenCalled();
    });

    test("requires a geocoded location and retains submitted values on validation errors", async () => {
        const res = response();
        const body = {
            category: "Menuisier bois",
            work_title: "Construire une cuisine",
            description: "Cuisine sur mesure.",
            address_text: "Cotonou",
        };

        await publishAnnouncement({ session: { userRole: "client" }, body }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith("requests/feed", expect.objectContaining({
            formValues: expect.objectContaining(body),
            errors: expect.arrayContaining(["Sélectionnez une adresse valide dans les suggestions."]),
        }));
        expect(createRequest).not.toHaveBeenCalled();
    });

    test("persists a detailed announcement and notifies nearby professionals", async () => {
        const res = response();
        const req = {
            session: { userRole: "client", userId: 19 },
            body: {
                category: "Menuisier bois",
                work_title: "Fabriquer une cuisine sur mesure",
                description: "Réaliser et poser des meubles pour une cuisine de 12 m².",
                professional_requirements: "Expérience en agencement intérieur.",
                project_timeline: "Novembre",
                address_text: "Cotonou, Bénin",
                lat: "6.3703",
                lng: "2.3912",
                budget_estimate: "250000",
            },
        };

        await publishAnnouncement(req, res);

        expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({
            client_id: 19,
            category: "Menuisier bois",
            work_title: "Fabriquer une cuisine sur mesure",
            professional_requirements: "Expérience en agencement intérieur.",
            project_timeline: "Novembre",
            lat: 6.3703,
            lng: 2.3912,
            budget_estimate: 250000,
        }), expect.any(Object));
        expect(notifyProfessionalsForRequest).toHaveBeenCalledWith({
            lat: 6.3703,
            lng: 2.3912,
            category: "Menuisier bois",
        }, expect.any(Object));
        expect(res.redirect).toHaveBeenCalledWith("/requests/feed");
    });
});
