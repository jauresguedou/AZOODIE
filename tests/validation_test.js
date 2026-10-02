jest.mock("../models/professional-model", () => ({
    getProfessionalById: jest.fn(),
}));

jest.mock("express-validator", () => ({
    body: jest.fn(() => {
        const chain = {
            trim: () => chain,
            notEmpty: () => chain,
            withMessage: () => chain,
            isFloat: () => chain,
            isInt: () => chain,
            optional: () => chain,
        };
        return chain;
    }),
    validationResult: () => ({
        isEmpty: () => false,
        array: () => [{ msg: "Invalid value" }],
    }),
}));

const { getProfessionalById } = require("../models/professional-model");
const { checkValidation } = require("../middleware/validation");

describe("checkValidation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function response() {
        return {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            render(view, locals) {
                this.view = view;
                this.locals = locals;
                return this;
            },
            send(message) {
                this.message = message;
                return this;
            },
        };
    }

    test("re-renders invalid edits with the edit form and submitted values", async () => {
        const res = response();
        const submittedValues = { name: "Edited name" };
        getProfessionalById.mockResolvedValue({ id: "8", name: "Current name" });
        const req = {
            baseUrl: "/professionals",
            params: { id: "8" },
            body: submittedValues,
        };

        await checkValidation(req, res, jest.fn());

        expect(res.statusCode).toBe(400);
        expect(res.view).toBe("professionals/edit-form");
        expect(res.locals.professional.name).toBe("Current name");
        expect(res.locals.formValues).toBe(submittedValues);
    });

    test("returns not found instead of rendering an edit form for a deleted profile", async () => {
        const res = response();
        getProfessionalById.mockResolvedValue(undefined);

        await checkValidation({
            baseUrl: "/professionals",
            params: { id: "8" },
            body: {},
        }, res, jest.fn());

        expect(res.statusCode).toBe(404);
        expect(res.view).toBeUndefined();
    });
});
