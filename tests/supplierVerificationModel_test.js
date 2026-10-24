jest.mock("../config/database", () => ({
    query: jest.fn(),
}));

jest.mock("../utils/withTransaction", () =>
    jest.fn(async (pool, operation) => {
        const client = {
            query: jest.fn(),
        };

        client.query
            .mockResolvedValueOnce({ rows: [{ id: 7, verified: false }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
                rows: [{
                    id: 101,
                    supplier_id: 7,
                    status: "pending",
                    submitted_at: "2026-10-24T08:00:00.000Z",
                }],
            })
            .mockResolvedValue({ rows: [], rowCount: 1 });

        const result = await operation(client);

        client.queryMock = client.query;
        return result;
    })
);

const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");
const {
    getLatestVerificationRequest,
    submitVerificationRequest,
} = require("../models/supplier-verification-model");

describe("supplier-verification-model", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getLatestVerificationRequest", () => {
        it("returns the latest request without querying document URLs", async () => {
            const request = {
                id: 101,
                supplier_id: 7,
                status: "pending",
            };

            pool.query.mockResolvedValueOnce({ rows: [request] });

            await expect(
                getLatestVerificationRequest(7)
            ).resolves.toEqual(request);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining("FROM supplier_verification_requests"),
                [7]
            );
            expect(pool.query.mock.calls[0][0]).not.toMatch(
                /supplier_verification_documents/
            );
        });

        it("returns null when no request exists", async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            await expect(
                getLatestVerificationRequest(7)
            ).resolves.toBeNull();
        });
    });

    describe("submitVerificationRequest", () => {
        const documents = [{
            public_id: "azoodie/supplier-verification/document-1",
            format: "pdf",
        }];

        it("rejects an empty document list before starting a transaction", async () => {
            await expect(
                submitVerificationRequest(7, [])
            ).rejects.toThrow(
                "Une demande doit contenir entre 1 et 3 documents."
            );

            expect(withTransaction).not.toHaveBeenCalled();
        });

        it("rejects an invalid public ID before starting a transaction", async () => {
            await expect(
                submitVerificationRequest(7, [{
                    public_id: "other-folder/document",
                    format: "pdf",
                }])
            ).rejects.toThrow(
                "Référence ou format de document de vérification invalide."
            );

            expect(withTransaction).not.toHaveBeenCalled();
        });

        it("creates a pending request and stores its document reference", async () => {
            const result = await submitVerificationRequest(7, documents);

            expect(result.status).toBe("submitted");
            expect(result.request.id).toBe(101);
            expect(withTransaction).toHaveBeenCalledTimes(1);
        });
    });
});
