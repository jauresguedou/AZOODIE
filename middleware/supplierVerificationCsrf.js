const { timingSafeEqual, randomBytes } = require("crypto");

function ensureSupplierVerificationCsrfToken(req, res, next) {
    if (!req.session) {
        return res.status(500).send("Session indisponible.");
    }

    if (!req.session.supplierVerificationCsrfToken) {
        req.session.supplierVerificationCsrfToken =
            randomBytes(32).toString("hex");
    }

    res.locals.supplierVerificationCsrfToken =
        req.session.supplierVerificationCsrfToken;

    next();
}

function sendCsrfError(req, res) {
    const accept = req.get
        ? req.get("Accept")
        : req.headers?.accept;

    const message =
        "Jeton de sécurité invalide. Rechargez la page et réessayez.";

    if (typeof accept === "string" &&
        accept.includes("application/json")) {
        return res.status(403).json({ message });
    }

    return res.status(403).send(message);
}

function verifySupplierVerificationCsrf(req, res, next) {
    const expected = req.session?.supplierVerificationCsrfToken;
    const received = req.get
        ? req.get("X-CSRF-Token")
        : req.headers?.["x-csrf-token"];

    if (
        typeof expected !== "string" ||
        typeof received !== "string"
    ) {
        return sendCsrfError(req, res);
    }

    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(received, "utf8");

    if (
        expectedBuffer.length !== receivedBuffer.length ||
        !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
        return sendCsrfError(req, res);
    }

    next();
}

module.exports = {
    ensureSupplierVerificationCsrfToken,
    verifySupplierVerificationCsrf,
};
