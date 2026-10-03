const { validatePortfolioCaption } = require("../controllers/professionalController");

describe("professional portfolio caption validation", () => {
    test("handles a missing parsed multipart body without throwing", () => {
        const req = {};
        const next = jest.fn();
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

        validatePortfolioCaption(req, res, next);

        expect(req.body).toEqual({ caption: "" });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("trims a parsed caption and allows up to 500 characters", () => {
        const req = { body: { caption: `  ${"a".repeat(500)}  ` } };
        const next = jest.fn();
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

        validatePortfolioCaption(req, res, next);

        expect(req.body.caption).toBe("a".repeat(500));
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("rejects captions longer than 500 characters", () => {
        const req = { body: { caption: "a".repeat(501) } };
        const next = jest.fn();
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

        validatePortfolioCaption(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("La légende ne peut pas dépasser 500 caractères.");
        expect(next).not.toHaveBeenCalled();
    });
});
