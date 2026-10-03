const ejs = require("ejs");
const path = require("path");

const feedTemplate = path.join(__dirname, "..", "views", "requests", "feed.ejs");

describe("client project announcement feed", () => {
    const defaultLocals = {
        session: { userRole: "client", userId: 19 },
        announcements: [],
        tradeCategories: [{ label: "Bois et menuiserie", trades: ["Menuisier bois"] }],
        errors: [],
        formValues: {},
    };

    test("gives clients a structured composer for professional requirements and project details", async () => {
        const html = await ejs.renderFile(feedTemplate, defaultLocals);

        expect(html).toContain('action="/requests/feed"');
        expect(html).toContain('name="category"');
        expect(html).toContain("Quel professionnel recherchez-vous ?");
        expect(html).toContain('name="work_title"');
        expect(html).toContain('name="professional_requirements"');
        expect(html).toContain('name="project_timeline"');
        expect(html).toContain('name="address_text"');
        expect(html).toContain('name="lat"');
    });

    test("renders project announcements as professional feed cards", async () => {
        const html = await ejs.renderFile(feedTemplate, {
            ...defaultLocals,
            session: { userRole: "professional", userId: 7, professionalId: 12 },
            announcements: [{
                id: 2,
                client_name: "Aïcha",
                client_photo: null,
                category: "Menuisier bois",
                work_title: "Fabriquer et poser des placards",
                description: "Placards sur mesure dans deux chambres.",
                professional_requirements: "Références en agencement intérieur.",
                project_timeline: "En novembre",
                budget_estimate: "250000",
                address_text: "Cotonou, Bénin",
                status: "open",
                created_at: new Date("2026-09-03T10:00:00Z"),
            }],
        });

        expect(html).toContain("Aïcha");
        expect(html).toContain("Fabriquer et poser des placards");
        expect(html).toContain("Placards sur mesure dans deux chambres.");
        expect(html).toContain("Références en agencement intérieur.");
        expect(html).toContain("En novembre");
        expect(html).toContain("Cotonou, Bénin");
        expect(html).not.toContain('action="/requests/feed"');
    });
});
