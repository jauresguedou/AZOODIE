const { randomBytes, timingSafeEqual } = require("crypto");

function ensureConstructionCsrfToken(req, res, next) {
    if (!req.session) {
        return res.status(500).send("Session indisponible.");
    }

    if (!req.session.constructionCsrfToken) {
        req.session.constructionCsrfToken = randomBytes(32).toString("hex");
    }

    res.locals.constructionCsrfToken =
        req.session.constructionCsrfToken;

    next();
}

function verifyConstructionCsrf(req, res, next) {
    const expected = req.session?.constructionCsrfToken;
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
    ensureConstructionCsrfToken,
    verifyConstructionCsrf
};
