const {
    ensureSupplierVerificationCsrfToken,
    verifySupplierVerificationCsrf,
} = require("../middleware/supplierVerificationCsrf");

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
        },
    };
}

function makeRequest(token, expectedToken) {
    return {
        session: expectedToken
            ? { supplierVerificationCsrfToken: expectedToken }
            : {},
        headers: token ? { "x-csrf-token": token } : {},
        get(name) {
            return this.headers[name.toLowerCase()];
        },
    };
}

describe("Supplier verification CSRF middleware", () => {
    test("creates a session token and exposes it to the view", () => {
        const req = { session: {} };
        const res = makeResponse();
        const next = jest.fn();

        ensureSupplierVerificationCsrfToken(req, res, next);

        expect(req.session.supplierVerificationCsrfToken)
            .toMatch(/^[a-f0-9]{64}$/);
        expect(res.locals.supplierVerificationCsrfToken).toBe(
            req.session.supplierVerificationCsrfToken
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("keeps an existing token stable", () => {
        const token = "a".repeat(64);
        const req = {
            session: { supplierVerificationCsrfToken: token },
        };
        const res = makeResponse();
        const next = jest.fn();

        ensureSupplierVerificationCsrfToken(req, res, next);

        expect(res.locals.supplierVerificationCsrfToken).toBe(token);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("rejects a missing token", () => {
        const req = makeRequest(undefined, "a".repeat(64));
        const res = makeResponse();
        const next = jest.fn();

        verifySupplierVerificationCsrf(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res.message).toMatch(/Jeton de sécurité invalide/);
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a forged token", () => {
        const req = makeRequest("b".repeat(64), "a".repeat(64));
        const res = makeResponse();
        const next = jest.fn();

        verifySupplierVerificationCsrf(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("accepts the matching token", () => {
        const token = "a".repeat(64);
        const req = makeRequest(token, token);
        const res = makeResponse();
        const next = jest.fn();

        verifySupplierVerificationCsrf(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
    });
});
