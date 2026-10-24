jest.mock("../models/supplier-model", () => ({
    getSupplierByUserId: jest.fn(),
    createSupplier: jest.fn(),
}));

jest.mock("../models/supplier-verification-model", () => ({
    getLatestVerificationRequest: jest.fn(),
    submitVerificationRequest: jest.fn(),
}));


jest.mock("../utils/cleanupSupplierVerificationAssets", () =>
    jest.fn().mockResolvedValue(undefined)
);

const cleanupSupplierVerificationAssets = require(
    "../utils/cleanupSupplierVerificationAssets"
);

const verificationModel = require("../models/supplier-verification-model");
const {
    submitSupplierVerification,
} = require("../controllers/supplierController");

function createResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        render: jest.fn(),
        redirect: jest.fn(),
    };
}

function createRequest(files = []) {
    return {
        supplier: { id: 12, verified: false },
        session: {
            userId: 7,
            supplierVerificationCsrfToken: "test-token",
        },
        files,
        get: jest.fn((header) => {
            if (header === "Accept") return "application/json";
            return undefined;
        }),
    };
}

describe("supplier verification submission controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        cleanupSupplierVerificationAssets.mockResolvedValue(undefined);
    });

    test("returns success for a submitted request", async () => {
        verificationModel.submitVerificationRequest.mockResolvedValue({
            status: "submitted",
        });

        const req = createRequest([
            {
                public_id: "azoodie/supplier-verification/document-1",
                format: "pdf",
            },
        ]);
        const res = createResponse();
        const next = jest.fn();

        await submitSupplierVerification(req, res, next);

        expect(verificationModel.submitVerificationRequest).toHaveBeenCalledWith(
            12,
            [{
                public_id: "azoodie/supplier-verification/document-1",
                format: "pdf",
            }]
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            redirect: "/supplier/dashboard",
        });
        expect(next).not.toHaveBeenCalled();
        expect(cleanupSupplierVerificationAssets).not.toHaveBeenCalled();
    });

    test.each(["pending", "already_verified"])(
        "cleans up newly uploaded documents when status is %s",
        async (status) => {
            verificationModel.submitVerificationRequest.mockResolvedValue({
                status,
            });

            const files = [
                {
                    public_id: "azoodie/supplier-verification/document-new",
                    format: "pdf",
                },
            ];
            const req = createRequest(files);
            const res = createResponse();
            const next = jest.fn();

            await submitSupplierVerification(req, res, next);

            expect(cleanupSupplierVerificationAssets).toHaveBeenCalledWith(
                files
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                redirect: "/supplier/dashboard",
            });
            expect(next).not.toHaveBeenCalled();
        }
    );

    test("rejects a submission without documents", async () => {
        const req = createRequest([]);
        const res = createResponse();
        const next = jest.fn();

        await submitSupplierVerification(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Veuillez joindre entre 1 et 3 documents.",
        });
        expect(verificationModel.submitVerificationRequest).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    test("does not report success when the model returns null", async () => {
        verificationModel.submitVerificationRequest.mockResolvedValue(null);

        const req = createRequest([
            {
                public_id: "azoodie/supplier-verification/document-1",
                format: "pdf",
            },
        ]);
        const res = createResponse();
        const next = jest.fn();

        await submitSupplierVerification(req, res, next);

        expect(res.json).not.toHaveBeenCalledWith({
            redirect: "/supplier/dashboard",
        });
        expect(res.redirect).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String),
            })
        );
    });

    test("passes unexpected model errors to Express", async () => {
        const modelError = new Error("Database unavailable");

        verificationModel.submitVerificationRequest.mockRejectedValue(modelError);

        const req = createRequest([
            {
                public_id: "azoodie/supplier-verification/document-1",
                format: "pdf",
            },
        ]);
        const res = createResponse();
        const next = jest.fn();

        await submitSupplierVerification(req, res, next);

        expect(next).toHaveBeenCalledWith(modelError);
        expect(res.json).not.toHaveBeenCalled();
    });
});
