jest.mock("../config/supplierVerificationUpload", () => jest.fn());

const upload = require("../config/supplierVerificationUpload");
const middleware = require("../middleware/supplierVerificationUpload");

describe("supplierVerificationUpload middleware", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: { accept: "application/json" },
            get: jest.fn(() => "application/json"),
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        next = jest.fn();
    });

    test("continues when the upload succeeds", () => {
        upload.mockImplementation((req, res, callback) => {
            callback(null);
        });

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 400 when a file exceeds 10 MB", () => {
        const error = new Error("File too large");
        error.name = "MulterError";
        error.code = "LIMIT_FILE_SIZE";

        upload.mockImplementation((req, res, callback) => {
            callback(error);
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Chaque document doit peser au maximum 10 Mo.",
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 400 when more than three files are submitted", () => {
        const error = new Error("Too many files");
        error.name = "MulterError";
        error.code = "LIMIT_FILE_COUNT";

        upload.mockImplementation((req, res, callback) => {
            callback(error);
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Vous pouvez joindre au maximum 3 documents.",
        });
    });

    test("returns 400 for a rejected file format", () => {
        const error = new Error(
            "Format non autorisé. Choisissez un fichier PDF, JPEG, PNG ou WebP."
        );
        error.status = 400;

        upload.mockImplementation((req, res, callback) => {
            callback(error);
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: error.message,
        });
    });

    test("returns a generic 500 for an internal storage error", () => {
        const error = new Error("Private Cloudinary credentials leaked here");
        const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        upload.mockImplementation((req, res, callback) => {
            callback(error);
        });

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message:
                "Une erreur interne a empêché le téléversement. Réessayez plus tard.",
        });
        expect(JSON.stringify(res.json.mock.calls)).not.toContain(
            "Private Cloudinary credentials"
        );
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    test("passes a safe 500 error to Express for HTML requests", () => {
        req.get.mockReturnValue("text/html");

        const error = new Error("Internal storage failure");

        upload.mockImplementation((req, res, callback) => {
            callback(error);
        });

        const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);

        const safeError = next.mock.calls[0][0];

        expect(safeError).toBeInstanceOf(Error);
        expect(safeError.status).toBe(500);
        expect(safeError.message).toBe(
            "Une erreur interne a empêché le téléversement. Réessayez plus tard."
        );
        expect(safeError.message).not.toContain("Internal storage failure");
        expect(res.status).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
});
