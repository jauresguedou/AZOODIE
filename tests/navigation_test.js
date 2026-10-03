const ejs = require("ejs");
const path = require("path");

const navigationTemplate = path.join(__dirname, "..", "views", "partials", "nav.ejs");

describe("professional notifications navigation", () => {
    async function renderNavigation(unreadCount) {
        return ejs.renderFile(navigationTemplate, {
            session: {
                userId: 7,
                userRole: "professional",
                professionalId: 12,
            },
            unreadCount,
        });
    }

    test("renders an accessible bell without a red dot when there are no unread notifications", async () => {
        const html = await renderNavigation(0);

        expect(html).toContain('href="/professionals/notifications"');
        expect(html).toContain('aria-label="Notifications"');
        expect(html).toContain("<svg");
        expect(html).not.toContain("nav-notification-dot");
        expect(html).not.toMatch(/>\s*Notifications\s*</);
    });

    test("adds a red notification dot and accessible announcement when unread notifications exist", async () => {
        const html = await renderNavigation(3);

        expect(html).toContain('aria-label="Notifications, nouvelles notifications"');
        expect(html).toContain('class="nav-notification-dot"');
        expect(html).toContain('title="Nouvelles notifications"');
    });

    test("links professional profile navigation to the professional profile", async () => {
        const html = await renderNavigation(0);

        expect(html).toContain('href="/professionals/12">Mon profil</a>');
        expect(html).not.toContain('href="/profile">Mon profil</a>');
    });

    test("links professionals without a profile to professional profile creation", async () => {
        const html = await ejs.renderFile(navigationTemplate, {
            session: {
                userId: 7,
                userRole: "professional",
                professionalId: null,
            },
            unreadCount: 0,
        });

        expect(html).toContain('href="/professionals/add">Mon profil</a>');
        expect(html).not.toContain('href="/profile">Mon profil</a>');
    });

    test("keeps client profiles linked to the client profile page", async () => {
        const html = await ejs.renderFile(navigationTemplate, {
            session: {
                userId: 7,
                userRole: "client",
                professionalId: null,
            },
            unreadCount: 0,
        });

        expect(html).toContain('href="/profile">Mon profil</a>');
        expect(html).not.toContain('href="/professionals/add">Mon profil</a>');
    });

    test("removes discovery links from the professional navigation", async () => {
        const html = await renderNavigation(0);

        expect(html).not.toContain(">Rechercher</a>");
        expect(html).not.toContain(">Professionnels</a>");
    });

    test("keeps discovery links in the client navigation", async () => {
        const html = await ejs.renderFile(navigationTemplate, {
            session: {
                userId: 7,
                userRole: "client",
                professionalId: null,
            },
            unreadCount: 0,
        });

        expect(html).toContain(">Rechercher</a>");
        expect(html).toContain(">Professionnels</a>");
    });
});
