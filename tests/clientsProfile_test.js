const ejs = require("ejs");
const path = require("path");

const profileTemplate = path.join(__dirname, "..", "views", "clients", "profile.ejs");

describe("client profile template", () => {
    const user = {
        name: "Awa Test",
        email: "awa@example.test",
        photo_url: null,
        created_at: "2025-03-01T00:00:00.000Z",
    };

    test("renders a polished empty state when there are no announcements", async () => {
        const html = await ejs.renderFile(profileTemplate, { user, announcements: [] });

        expect(html).toContain("Awa Test");
        expect(html).toContain("<h3>Votre activité commence ici</h3>");
        expect(html).toContain("Demandes publiées");
        expect(html).toContain("Demandes en cours");
        expect(html).toContain('href="/professionals"');
    });

    test("renders announcement activity, status, and summary counts", async () => {
        const announcements = [
            {
                category: "Plomberie",
                description: "Réparer le robinet",
                address_text: "Cotonou",
                status: "open",
            },
            {
                category: "Peinture",
                description: "Repeindre une chambre",
                address_text: "Akpakpa",
                status: "closed",
            },
        ];
        const html = await ejs.renderFile(profileTemplate, { user, announcements });

        expect(html).toContain("<h3>Plomberie</h3>");
        expect(html).toContain("Réparer le robinet");
        expect(html).toContain("Cotonou");
        expect(html).toMatch(/profile-status-open">\s*En cours\s*<\/span>/);
        expect(html).toMatch(/profile-status-closed">\s*Terminée\s*<\/span>/);
        expect(html).toContain("<span class=\"profile-count\">2</span>");
        expect(html).toContain("<strong>1</strong>");
    });
});
