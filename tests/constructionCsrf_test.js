const {
    ensureConstructionCsrfToken,
    verifyConstructionCsrf
} = require("../middleware/constructionCsrf");

function makeResponse() {
    return {
        locals: {},
        statusCode: 200,
        message: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(message) {
            this.message = message;
            return this;
        }
    };
}

describe("Construction CSRF middleware", () => {
    test("creates a session token and exposes it to the view", () => {
        const req = { session: {} };
        const res = makeResponse();
        const next = jest.fn();

        ensureConstructionCsrfToken(req, res, next);

        expect(req.session.constructionCsrfToken).toMatch(/^[a-f0-9]{64}$/);
        expect(res.locals.constructionCsrfToken).toBe(
            req.session.constructionCsrfToken
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("keeps an existing token stable across page requests", () => {
        const token = "a".repeat(64);
        const req = { session: { constructionCsrfToken: token } };
        const res = makeResponse();
        const next = jest.fn();

        ensureConstructionCsrfToken(req, res, next);

        expect(req.session.constructionCsrfToken).toBe(token);
        expect(res.locals.constructionCsrfToken).toBe(token);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("rejects a missing token", () => {
        const req = { session: {}, body: {} };
        const res = makeResponse();
        const next = jest.fn();

        verifyConstructionCsrf(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res.message).toMatch(/Jeton de sécurité invalide/);
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a forged token", () => {
        const req = {
            session: { constructionCsrfToken: "a".repeat(64) },
            body: { _csrf: "b".repeat(64) }
        };
        const res = makeResponse();
        const next = jest.fn();

        verifyConstructionCsrf(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("accepts the matching token", () => {
        const token = "a".repeat(64);
        const req = {
            session: { constructionCsrfToken: token },
            body: { _csrf: token }
        };
        const res = makeResponse();
        const next = jest.fn();

        verifyConstructionCsrf(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
    });
});
