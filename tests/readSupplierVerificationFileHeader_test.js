const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const {
    readSupplierVerificationFileHeader,
} = require("../utils/readSupplierVerificationFileHeader");

describe("readSupplierVerificationFileHeader", () => {
    let directory;
    let filePath;

    beforeEach(async () => {
        directory = await fs.mkdtemp(
            path.join(os.tmpdir(), "azoodie-verification-")
        );
        filePath = path.join(directory, "document.bin");
    });

    afterEach(async () => {
        await fs.rm(directory, { recursive: true, force: true });
    });

    test("reads at most the first 12 bytes", async () => {
        await fs.writeFile(
            filePath,
            Buffer.from("%PDF-1.7\nEXTRA-CONTENT")
        );

        const header =
            await readSupplierVerificationFileHeader(filePath);

        expect(header.length).toBe(12);
        expect(header.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    });

    test("returns the available bytes for a short file", async () => {
        await fs.writeFile(filePath, Buffer.from("%PDF"));

        const header =
            await readSupplierVerificationFileHeader(filePath);

        expect(header.toString("ascii")).toBe("%PDF");
    });

    test("returns an empty buffer for an empty file", async () => {
        await fs.writeFile(filePath, Buffer.alloc(0));

        const header =
            await readSupplierVerificationFileHeader(filePath);

        expect(header).toEqual(Buffer.alloc(0));
    });

    test("rejects a path that does not exist", async () => {
        await expect(
            readSupplierVerificationFileHeader(
                path.join(directory, "missing.bin")
            )
        ).rejects.toThrow();
    });
});
