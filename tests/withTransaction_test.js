const withTransaction = require("../utils/withTransaction");

describe("withTransaction", () => {
    function createPool() {
        const client = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn(),
        };
        return {
            client,
            connect: jest.fn().mockResolvedValue(client),
        };
    }

    test("commits successful work and releases the client", async () => {
        const pool = createPool();
        const operation = jest.fn().mockResolvedValue("completed");

        await expect(withTransaction(pool, operation)).resolves.toBe("completed");

        expect(pool.client.query).toHaveBeenNthCalledWith(1, "BEGIN");
        expect(operation).toHaveBeenCalledWith(pool.client);
        expect(pool.client.query).toHaveBeenNthCalledWith(2, "COMMIT");
        expect(pool.client.release).toHaveBeenCalledTimes(1);
    });

    test("rolls back failed work, releases the client, and preserves the failure", async () => {
        const pool = createPool();
        const failure = new Error("write failed");
        const operation = jest.fn().mockRejectedValue(failure);

        await expect(withTransaction(pool, operation)).rejects.toBe(failure);

        expect(pool.client.query).toHaveBeenNthCalledWith(1, "BEGIN");
        expect(pool.client.query).toHaveBeenNthCalledWith(2, "ROLLBACK");
        expect(pool.client.release).toHaveBeenCalledTimes(1);
    });
});
