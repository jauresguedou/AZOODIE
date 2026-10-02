jest.mock("../models/user-model", () => ({
    getUserById: jest.fn(),
    updateUserPhoto: jest.fn(),
}));

jest.mock("../models/request-model", () => ({
    getRequestsByClient: jest.fn(),
}));

jest.mock("../models/professional-model", () => ({
    getProfessionalById: jest.fn(),
}));

const { getProfessionalById } = require("../models/professional-model");
const { showMyProfile } = require("../controllers/clientController");

describe("professional routing from the client profile endpoint", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function response() {
        return {
            redirect: jest.fn(),
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    }

    test("redirects professionals with profiles to their public professional profile", async () => {
        getProfessionalById.mockResolvedValue({ id: 12 });
        const res = response();

        await showMyProfile({
            session: { userRole: "professional", professionalId: 12 },
        }, res);

        expect(res.redirect).toHaveBeenCalledWith("/professionals/12");
        expect(res.render).not.toHaveBeenCalled();
    });

    test("redirects professionals without profiles to professional profile creation", async () => {
        const res = response();

        await showMyProfile({
            session: { userRole: "professional", professionalId: null },
        }, res);

        expect(res.redirect).toHaveBeenCalledWith("/professionals/add");
        expect(getProfessionalById).not.toHaveBeenCalled();
    });

    test("clears a stale professional session before sending the user to profile creation", async () => {
        getProfessionalById.mockResolvedValue(undefined);
        const save = jest.fn((callback) => callback(null));
        const res = response();

        await showMyProfile({
            session: { userRole: "professional", professionalId: 12, save },
        }, res);

        expect(save).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("/professionals/add");
    });
});
