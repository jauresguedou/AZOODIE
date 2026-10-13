
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

const {
    requireAnnouncementAuthor,
} = require("../middleware/announcementAuth");

describe("announcement feed actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        model.getPublishedAnnouncements.mockResolvedValue([]);
        model.getAnnouncementComments.mockResolvedValue([]);
        model.getClientDrafts.mockResolvedValue([]);
        model.createAnnouncement.mockResolvedValue({ id: 10 });
    });

    function response() {
        return {
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
            send: jest.fn(),
            redirect: jest.fn(),
        };
    }

    test("renders published announcements for anonymous visitors", async () => {
        model.getPublishedAnnouncements.mockResolvedValue([
            { id: 1, title: "Peinture", status: "published" },
        ]);

        const res = response();

        await showHomeFeed({ session: {} }, res);

        expect(model.getPublishedAnnouncements).toHaveBeenCalledWith(null);
        expect(model.getClientDrafts).not.toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith(
            "home/index",
            expect.objectContaining({
                announcements: [
                    {
                        id: 1,
                        title: "Peinture",
                        status: "published",
                        comments: [],
                    },
                ],
                drafts: [],
            })
        );
    });

    test("renders published announcements and only the signed-in client's drafts", async () => {
        model.getPublishedAnnouncements.mockResolvedValue([{ id: 1 }]);
        model.getClientDrafts.mockResolvedValue([{ id: 2 }]);

        const res = response();

        await showHomeFeed(
            { session: { userId: 4, userRole: "client" } },
            res
        );

        expect(model.getPublishedAnnouncements).toHaveBeenCalledWith(4);
        expect(model.getClientDrafts).toHaveBeenCalledWith(4);
        expect(res.render).toHaveBeenCalledWith(
            "home/index",
            expect.objectContaining({
                announcements: [{ id: 1, comments: [] }],
                drafts: [{ id: 2 }],
            })
        );
    });

    test.each(["client", "professional"])(
        "allows a logged-in %s to pass announcement author authorization",
        (userRole) => {
            const req = {
                session: { userId: 4, userRole },
            };
            const res = response();
            const next = jest.fn();

            requireAnnouncementAuthor(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        }
    );

    test.each([
        ["anonymous visitor", {}],
        ["missing user ID", { userRole: "client" }],
        ["unsupported role", { userId: 4, userRole: "admin" }],
    ])("rejects %s from announcement author authorization", (_label, session) => {
        const res = response();
        const next = jest.fn();

        requireAnnouncementAuthor({ session }, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test("keeps draft management restricted to clients", () => {
        const res = response();
        const next = jest.fn();

        requireClient(
            { session: { userRole: "professional" } },
            res,
            next
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("restricts professional interactions to users with profiles", () => {
        const res = response();
        const next = jest.fn();

        requireProfessional(
            {
                session: {
                    userRole: "professional",
                    professionalId: null,
                },
            },
            res,
            next
        );

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test.each([
        ["client", "draft", "draft", "/#my-drafts"],
        ["client", "publish", "published", "/#announcements"],
        ["professional", "publish", "published", "/#announcements"],
    ])(
        "allows a %s to submit action=%s",
        async (userRole, action, expectedStatus, expectedRedirect) => {
            const res = response();

            await createAnnouncement(
                {
                    session: { userId: 4, userRole },
                    body: {
                        title: "Peindre un salon",
                        category: "Peintre",
                        description: "Peinture intérieure soignée.",
                        address_text: "Cotonou",
                        action,
                    },
                    file: {
                        secure_url: "https://cdn.example.test/room.jpg",
                        mimetype: "image/jpeg",
                    },
                },
                res
            );

            expect(model.createAnnouncement).toHaveBeenCalledWith(
                expect.objectContaining({
                    authorId: 4,
                    title: "Peindre un salon",
                    mediaUrl: "https://cdn.example.test/room.jpg",
                    mediaType: "image",
                    status: expectedStatus,
                })
            );

            expect(res.redirect).toHaveBeenCalledWith(expectedRedirect);
        }
    );

    test("rejects professional draft submissions", async () => {
        const res = response();

        await createAnnouncement(
            {
                session: { userId: 8, userRole: "professional" },
                body: {
                    title: "Projet",
                    category: "Maçon",
                    description: "Travaux de maçonnerie.",
                    action: "draft",
                },
            },
            res
        );

        expect(model.createAnnouncement).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith(
            "home/index",
            expect.objectContaining({
                errors: expect.arrayContaining([
                    "Les professionnels doivent publier directement leurs annonces.",
                ]),
            })
        );
        expect(model.getClientDrafts).not.toHaveBeenCalled();
    });

    test("rejects empty announcement descriptions without inserting", async () => {
        const res = response();

        await createAnnouncement(
            {
                session: {
                    userId: 4,
                    userRole: "client",
                },
                body: {
                    title: "Projet",
                    category: "Peintre",
                    description: "",
                    action: "publish",
                },
            },
            res
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.render).toHaveBeenCalledWith(
            "home/index",
            expect.objectContaining({
                errors: expect.arrayContaining([
                    "Décrivez les travaux souhaités.",
                ]),
            })
        );
        expect(model.createAnnouncement).not.toHaveBeenCalled();
    });

    test("publishes and deletes only drafts owned by the current client", async () => {
        model.publishClientDraft.mockResolvedValue(1);
        model.deleteClientDraft.mockResolvedValue(1);

        const req = {
            session: { userId: 4 },
            params: { id: "9" },
        };

        await publishDraft(req, response());
        await deleteDraft(req, response());

        expect(model.publishClientDraft).toHaveBeenCalledWith(4, "9");
        expect(model.deleteClientDraft).toHaveBeenCalledWith(4, "9");
    });

    test("toggles published-announcement likes and persists professional comments", async () => {
        model.toggleAnnouncementLike.mockResolvedValue({
            exists: true,
            liked: true,
        });
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
        expect(model.addAnnouncementComment).toHaveBeenCalledWith(
            12,
            "5",
            "Beau projet !"
        );
        expect(commentRes.redirect).toHaveBeenCalledWith(
            "/#announcement-5"
        );
    });
});
