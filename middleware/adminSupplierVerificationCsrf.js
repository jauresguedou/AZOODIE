const { randomBytes, timingSafeEqual } = require("crypto");

function ensureAdminSupplierVerificationCsrfToken(req, res, next) {
    if (!req.session) {
        return res.status(500).send("Session indisponible.");
    }

    if (!req.session.adminSupplierVerificationCsrfToken) {
        req.session.adminSupplierVerificationCsrfToken =
            randomBytes(32).toString("hex");
    }

    res.locals.adminSupplierVerificationCsrfToken =
        req.session.adminSupplierVerificationCsrfToken;

    next();
}

function verifyAdminSupplierVerificationCsrf(req, res, next) {
    const expected = req.session?.adminSupplierVerificationCsrfToken;
    const received = req.body?._csrf;

    if (
        typeof expected !== "string" ||
        typeof received !== "string"
    ) {
        return res.status(403).send(
            "Jeton de sécurité invalide. Rechargez la page."
        );
    }

    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(received, "utf8");

    if (
        expectedBuffer.length !== receivedBuffer.length ||
        !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
        return res.status(403).send(
            "Jeton de sécurité invalide. Rechargez la page."
        );
    }

    next();
}

module.exports = {
    ensureAdminSupplierVerificationCsrfToken,
    verifyAdminSupplierVerificationCsrf,
};
