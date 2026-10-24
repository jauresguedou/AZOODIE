const fs = require("fs/promises");

async function readSupplierVerificationFileHeader(filePath) {
    const handle = await fs.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await handle.read(
            buffer,
            0,
            buffer.length,
            0
        );

        return buffer.subarray(0, bytesRead);
    } finally {
        await handle.close();
    }
}

module.exports = { readSupplierVerificationFileHeader };
