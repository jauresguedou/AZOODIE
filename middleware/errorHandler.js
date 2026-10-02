function notFoundHandler(req, res, next) {
    const error = new Error("Page introuvable.");
    error.status = 404;
    next(error);
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const requestedStatus = Number(error.statusCode || error.status);
    const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
        ? requestedStatus
        : 500;
    const title = status === 404 ? "Page introuvable" : "Une erreur est survenue";
    const message = status < 500 && error.expose
        ? error.message
        : status === 404
            ? "La page demandée est introuvable."
            : "Une erreur est survenue. Veuillez réessayer plus tard.";

    if (status >= 500) {
        console.error("Unhandled application error:", error);
    }

    res.status(status).render("errors/error", { title, status, message }, (renderError, html) => {
        if (renderError) {
            return next(renderError);
        }

        res.send(html);
    });
}

module.exports = { notFoundHandler, errorHandler };