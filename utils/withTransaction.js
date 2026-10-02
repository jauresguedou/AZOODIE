async function withTransaction(pool, operation) {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const result = await operation(client);

        await client.query("COMMIT");
        transactionStarted = false;
        return result;
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                throw new AggregateError(
                    [error, rollbackError],
                    "Transaction failed and rollback could not be completed."
                );
            }
        }
        throw error;
    } finally {
        client.release();
    }
}

module.exports = withTransaction;
