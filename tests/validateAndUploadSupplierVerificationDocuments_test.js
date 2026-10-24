const fs = require("fs/promises");
const os = require("os");
const path = require("path");

jest.mock("cloudinary", () => ({
    v2: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

const cloudinary = require("cloudinary").v2;

const validateAndUploadSupplierVerificationDocuments = require(
    "../middleware/validateAndUploadSupplierVerificationDocuments"
);

describe("validateAndUploadSupplierVerificationDocuments", () => {
    let temporaryFiles;
    let next;
    let req;
    let res;

    async function createTemporaryFile(contents, originalname = "document.pdf") {
        const filePath = path.join(
            os.tmpdir(),
            `azoodie-verification-test-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`
        );

        await fs.writeFile(filePath, contents);
        temporaryFiles.push(filePath);

        return {
            path: filePath,
            originalname,
            mimetype: "application/pdf",
            size: Buffer.byteLength(contents),
        };
    }

    beforeEach(() => {
        temporaryFiles = [];
        next = jest.fn();
        req = {
            files: [],
            headers: { accept: "application/json" },
            get: jest.fn((name) => {
                if (name.toLowerCase() === "accept") {
                    return "application/json";
                }
                return undefined;
            }),
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        cloudinary.uploader.upload.mockReset();
        cloudinary.uploader.destroy.mockReset();

        cloudinary.uploader.destroy.mockResolvedValue({
            result: "ok",
        });
    });

    afterEach(async () => {
        await Promise.all(
            temporaryFiles.map(async (filePath) => {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    if (error.code !== "ENOENT") throw error;
                }
            })
        );
    });

    test("valide le fichier, l'envoie à Cloudinary et supprime le temporaire avant next", async () => {
        const file = await createTemporaryFile("%PDF-1.7\ncontenu de test");
        req.files = [file];

        cloudinary.uploader.upload.mockResolvedValue({
            public_id: "azoodie/supplier-verification/document-1",
            format: "pdf",
        });

        next.mockImplementation(async () => {
            await expect(fs.access(file.path)).rejects.toMatchObject({
                code: "ENOENT",
            });
        });

        await validateAndUploadSupplierVerificationDocuments(req, res, next);

        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
        expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
            file.path,
            expect.objectContaining({
                folder: "azoodie/supplier-verification",
                resource_type: "image",
                type: "authenticated",
                format: "pdf",
            })
        );

        expect(req.files).toEqual([
            {
                public_id: "azoodie/supplier-verification/document-1",
                format: "pdf",
            },
        ]);

        await expect(fs.access(file.path)).rejects.toMatchObject({
            code: "ENOENT",
        });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("refuse un fichier dont la signature ne correspond pas au PDF déclaré", async () => {
        const file = await createTemporaryFile("ceci n'est pas un PDF");
        req.files = [file];

        await validateAndUploadSupplierVerificationDocuments(req, res, next);

        expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: expect.stringContaining("Contenu de fichier non reconnu"),
        });
        expect(next).not.toHaveBeenCalled();

        await expect(fs.access(file.path)).rejects.toMatchObject({
            code: "ENOENT",
        });
    });

    test("supprime les ressources Cloudinary déjà envoyées si un envoi échoue", async () => {
        const firstFile = await createTemporaryFile("%PDF-1.7\npremier");
        const secondFile = await createTemporaryFile("%PDF-1.7\ndeuxième");

        req.files = [firstFile, secondFile];

        cloudinary.uploader.upload
            .mockResolvedValueOnce({
                public_id: "azoodie/supplier-verification/first",
                format: "pdf",
            })
            .mockRejectedValueOnce(new Error("Cloudinary indisponible"));

        await validateAndUploadSupplierVerificationDocuments(req, res, next);

        expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2);
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            "azoodie/supplier-verification/first",
            expect.objectContaining({
                resource_type: "image",
                type: "authenticated",
            })
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: expect.stringContaining("erreur interne"),
        });
        expect(next).not.toHaveBeenCalled();

        await expect(fs.access(firstFile.path)).rejects.toMatchObject({
            code: "ENOENT",
        });
        await expect(fs.access(secondFile.path)).rejects.toMatchObject({
            code: "ENOENT",
        });
    });

    test("continue sans téléversement lorsqu'aucun document n'est fourni", async () => {
        req.files = [];

        await validateAndUploadSupplierVerificationDocuments(req, res, next);

        expect(req.files).toEqual([]);
        expect(cloudinary.uploader.upload).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("transmet une erreur interne sûre à Express pour une requête HTML", async () => {
        const file = await createTemporaryFile("%PDF-1.7\ncontenu");
        req.files = [file];
        req.get.mockReturnValue("text/html");

        cloudinary.uploader.upload.mockRejectedValue(
            new Error("détail confidentiel Cloudinary")
        );

        await validateAndUploadSupplierVerificationDocuments(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 500,
                message: expect.not.stringContaining(
                    "détail confidentiel Cloudinary"
                ),
            })
        );

        await expect(fs.access(file.path)).rejects.toMatchObject({
            code: "ENOENT",
        });
    });
});
