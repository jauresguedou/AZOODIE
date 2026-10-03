const ejs = require("ejs");
const path = require("path");

const homeTemplate = path.join(__dirname, "..", "views", "home", "index.ejs");

describe("home announcement feed", () => {
    const announcement = {
        id: 5,
        author_name: "AZÔÔDIÉ · Exemple",
        author_photo: null,
        title: "Projet de démonstration",
        category: "Menuisier bois",
        description: "Rénovation et rangement sur mesure.",
        address_text: "Cotonou, Bénin",
        media_url: null,
        media_type: null,
        is_demo: true,
        created_at: new Date("2026-10-03T10:00:00Z"),
        like_count: 1,
        comment_count: 1,
        liked_by_viewer: false,
        comments: [{ author_name: "Pro", body: "Je peux vous accompagner." }],
    };

    test("renders the sample published announcement on the public homepage", async () => {
        const html = await ejs.renderFile(homeTemplate, {
            session: {},
            announcements: [announcement],
            drafts: [],
            formValues: {},
            errors: [],
        });

        expect(html).toContain("Fil des annonces");
        expect(html).toContain("Projet de démonstration");
        expect(html).toContain("Annonce de démonstration");
        expect(html).toContain("Cotonou, Bénin");
        expect(html).toContain("Rejoindre la communauté");
        expect(html).not.toContain("/announcements/5/like");
    });

    test("lets clients publish photos or short videos and manage their drafts", async () => {
        const html = await ejs.renderFile(homeTemplate, {
            session: { userId: 3, userRole: "client", userName: "Aïcha" },
            announcements: [announcement],
            drafts: [{
                id: 8,
                title: "Réparer une toiture",
                category: "Couvreur",
                description: "Remplacer quelques tuiles.",
            }],
            formValues: {},
            errors: [],
        });

        expect(html).toContain('action="/announcements"');
        expect(html).toContain('enctype="multipart/form-data"');
        expect(html).toContain('accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"');
        expect(html).toContain('value="draft"');
        expect(html).toContain('value="publish"');
        expect(html).toContain('id="my-drafts"');
        expect(html).toContain('action="/announcements/8/publish"');
        expect(html).toContain('action="/announcements/8/delete"');
    });

    test("shows professional like and comment controls and renders uploaded media", async () => {
        const html = await ejs.renderFile(homeTemplate, {
            session: { userId: 7, userRole: "professional", professionalId: 12 },
            announcements: [{
                ...announcement,
                media_url: "https://cdn.example.test/work.mp4",
                media_type: "video",
            }],
            drafts: [],
            formValues: {},
            errors: [],
        });

        expect(html).toContain('action="/announcements/5/like"');
        expect(html).toContain('action="/announcements/5/comments"');
        expect(html).toContain("<video");
        expect(html).toContain("https://cdn.example.test/work.mp4");
        expect(html).toContain("Je peux vous accompagner.");
    });
});
