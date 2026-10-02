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
});
