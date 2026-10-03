jest.mock("../models/announcement-model", () => ({
    getPublishedAnnouncements: jest.fn(),
    getAnnouncementComments: jest.fn(),
    getClientDrafts: jest.fn(),
    createAnnouncement: jest.fn(),
    publishClientDraft: jest.fn(),
    deleteClientDraft: jest.fn(),
    toggleAnnouncementLike: jest.fn(),
    addAnnouncementComment: jest.fn(),
}));

const model = require("../models/announcement-model");
const {
    showHomeFeed,
    requireClient,
    requireProfessional,
    createAnnouncement,
    publishDraft,
    deleteDraft,
    toggleLike,
    addComment,
} = require("../controllers/announcementController");

describe("announcement feed actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        model.getPublishedAnnouncements.mockResolvedValue([]);
        model.getAnnouncementComments.mockResolvedValue([]);
        model.getClientDrafts.mockResolvedValue([]);
    });

    function response() {
        return {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            send: jest.fn(),
            redirect: jest.fn(),
        };
    }

    test("renders public announcements and only the signed-in client's drafts", async () => {
        model.getPublishedAnnouncements.mockResolvedValue([{ id: 1 }]);
        model.getClientDrafts.mockResolvedValue([{ id: 2 }]);
        const res = response();

        await showHomeFeed({ session: { userId: 4, userRole: "client" } }, res);

        expect(model.getClientDrafts).toHaveBeenCalledWith(4);
        expect(res.render).toHaveBeenCalledWith("home/index", expect.objectContaining({
            announcements: [{ id: 1, comments: [] }],
            drafts: [{ id: 2 }],
        }));
    });

    test("restricts announcement creation to client accounts", () => {
        const res = response();
        const next = jest.fn();

        requireClient({ session: { userRole: "professional" } }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("restricts interactions to professionals with profiles", () => {
        const res = response();
        const next = jest.fn();

        requireProfessional({ session: { userRole: "professional", professionalId: null } }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("saves a new client announcement as a draft with uploaded image metadata", async () => {
        const res = response();
        await createAnnouncement({
            session: { userId: 4 },
            body: {
                title: "Peindre un salon",
                category: "Peintre",
                description: "Peinture intérieure soignée.",
                address_text: "Cotonou",
                action: "draft",
            },
            file: { secure_url: "https://cdn.example.test/room.jpg", mimetype: "image/jpeg" },
        }, res);

        expect(model.createAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
            authorId: 4,
            title: "Peindre un salon",
            mediaUrl: "https://cdn.example.test/room.jpg",
            mediaType: "image",
            status: "draft",
        }));
        expect(res.redirect).toHaveBeenCalledWith("/#my-drafts");
    });

    test("rejects empty announcement descriptions without inserting", async () => {
        const res = response();
        await createAnnouncement({
            session: { userId: 4 },
            body: { title: "Projet", category: "Peintre", description: "", action: "publish" },
        }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith("home/index", expect.objectContaining({
            errors: expect.arrayContaining(["Décrivez les travaux souhaités."]),
        }));
        expect(model.createAnnouncement).not.toHaveBeenCalled();
    });

    test("publishes and deletes only drafts owned by the current client", async () => {
        model.publishClientDraft.mockResolvedValue(1);
        model.deleteClientDraft.mockResolvedValue(1);
        const req = { session: { userId: 4 }, params: { id: "9" } };

        await publishDraft(req, response());
        await deleteDraft(req, response());

        expect(model.publishClientDraft).toHaveBeenCalledWith(4, "9");
        expect(model.deleteClientDraft).toHaveBeenCalledWith(4, "9");
    });

    test("toggles published-announcement likes and persists professional comments", async () => {
        model.toggleAnnouncementLike.mockResolvedValue({ exists: true, liked: true });
        model.addAnnouncementComment.mockResolvedValue(1);
        const req = {
            session: { userId: 12 },
            params: { id: "5" },
            body: { body: "  Beau projet !  " },
        };

        const likeRes = response();
        await toggleLike(req, likeRes);
        const commentRes = response();
        await addComment(req, commentRes);

        expect(likeRes.redirect).toHaveBeenCalledWith("/#announcement-5");
        expect(model.addAnnouncementComment).toHaveBeenCalledWith(12, "5", "Beau projet !");
        expect(commentRes.redirect).toHaveBeenCalledWith("/#announcement-5");
    });
});
