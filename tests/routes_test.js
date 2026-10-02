const http = require("http");

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "route-test-session-secret";

const app = require("../app");

function request(server, path) {
    return new Promise((resolve, reject) => {
        http.get({
            hostname: "127.0.0.1",
            port: server.address().port,
            path,
        }, (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                body += chunk;
            });
            response.on("end", () => {
                resolve({
                    status: response.statusCode,
                    location: response.headers.location,
                    body,
                });
            });
        }).on("error", reject);
    });
}

describe("application routes", () => {
    let server;

    beforeAll(async () => {
        server = app.listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
    });

    afterAll(async () => {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    });

    test.each([
        ["/", "AZÔÔDIÉ Localisation", "Trouvez un professionnel du bâtiment"],
        ["/login", "Connexion — AZÔÔDIÉ", "Se connecter"],
        ["/register", "Inscription — AZÔÔDIÉ", "Créer un compte"],
        ["/search", "Recherche — AZÔÔDIÉ", "Professionnels près de vous"],
    ])("GET %s renders successfully through the shared layout", async (path, expectedTitle, expectedText) => {
        const response = await request(server, path);

        expect(response.status).toBe(200);
        expect(response.body).toContain(`<title>${expectedTitle}</title>`);
        expect(response.body).toContain(expectedText);
        expect(response.body.match(/<html\b/g)).toHaveLength(1);
        expect(response.body.match(/class="site-nav"/g)).toHaveLength(1);
        expect(response.body.match(/class="site-footer"/g)).toHaveLength(1);
    });

    test("redirects unauthenticated users from protected routes to login", async () => {
        const response = await request(server, "/favorites");

        expect(response.status).toBe(302);
        expect(response.location).toBe("/login");
    });

    test("protects the professional dashboard", async () => {
        const response = await request(server, "/professionals/dashboard");

        expect(response.status).toBe(302);
        expect(response.location).toBe("/login");
    });

    test("returns an empty geocoding result for queries that are too short", async () => {
        const response = await request(server, "/api/geocode?q=ab");

        expect(response.status).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    test("rejects route requests without coordinates", async () => {
        const response = await request(server, "/api/route");

        expect(response.status).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ error: "Coordonnées manquantes." });
    });

    test("renders the not-found page for unknown routes", async () => {
        const response = await request(server, "/route-that-does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body).toContain("Page introuvable");
    });
});