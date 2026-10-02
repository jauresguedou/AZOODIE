jest.mock("../models/user-model", () => ({
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
}));

jest.mock("../config/mailer", () => ({
    sendVerificationEmail: jest.fn(),
}));

const { createUser, findUserByEmail } = require("../models/user-model");
const { sendVerificationEmail } = require("../config/mailer");
const { register } = require("../controllers/authController");

describe("register", () => {
    let response;

    beforeEach(() => {
        jest.clearAllMocks();
        response = {
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
        };
        findUserByEmail.mockResolvedValue(null);
        createUser.mockResolvedValue({
            id: 1,
            name: "Test User",
            email: "test@example.com",
        });
        sendVerificationEmail.mockResolvedValue(undefined);
    });

    test.each(["admin", "Admin", "administrator"])(
        "rejects the unsupported %s role without creating an account",
        async (role) => {
            await register({
                body: { name: "Test User", email: "test@example.com", password: "password123", role },
            }, response);

            expect(response.statusCode).toBe(400);
            expect(response.view).toBe("auth/register");
            expect(response.locals.errors[0].msg).toMatch(/type de compte/i);
            expect(findUserByEmail).not.toHaveBeenCalled();
            expect(createUser).not.toHaveBeenCalled();
        }
    );

    test.each(["client", "professional"])(
        "allows the supported %s role",
        async (role) => {
            await register({
                body: { name: "Test User", email: "test@example.com", password: "password123", role },
                protocol: "https",
                get: () => "example.test",
            }, response);

            expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role }));
            expect(response.view).toBe("auth/check-email");
        }
    );
});
