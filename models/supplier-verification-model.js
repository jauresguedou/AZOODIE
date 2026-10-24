const pool = require("../config/database");
const withTransaction = require("../utils/withTransaction");

const ALLOWED_FORMATS = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "pdf",
]);

/**
 * Returns the latest verification request without exposing document URLs.
 */
async function getLatestVerificationRequest(supplierId) {
    const result = await pool.query(
        `
        SELECT
            id,
            supplier_id,
            status,
            submitted_at,
            reviewed_by,
            reviewed_at,
            review_notes
        FROM supplier_verification_requests
        WHERE supplier_id = $1
        ORDER BY submitted_at DESC, id DESC
        LIMIT 1
        `,
        [supplierId]
    );

    return result.rows[0] || null;
}

/**
 * Creates a verification request and its private document references
 * in one transaction.
 *
 * Returns null if the supplier does not exist.
 * Returns an existing status if already verified or a request is pending.
 */
async function submitVerificationRequest(supplierId, documents) {
    if (!Array.isArray(documents) ||
        documents.length < 1 ||
        documents.length > 3) {
        throw new Error(
            "Une demande doit contenir entre 1 et 3 documents."
        );
    }

    const normalizedDocuments = documents.map((document) => {
        const publicId = document?.public_id;
        const format =
            typeof document?.format === "string"
                ? document.format.toLowerCase()
                : "";

        if (
            typeof publicId !== "string" ||
            !publicId.startsWith("azoodie/supplier-verification/") ||
            publicId.includes("..") ||
            !ALLOWED_FORMATS.has(format)
        ) {
            throw new Error(
                "Référence ou format de document de vérification invalide."
            );
        }

        return { publicId, format };
    });

    return withTransaction(pool, async (client) => {
        // Lock this supplier row to serialize concurrent submissions.
        const supplierResult = await client.query(
            `
            SELECT id, verified
            FROM suppliers
            WHERE id = $1
            FOR UPDATE
            `,
            [supplierId]
        );

        const supplier = supplierResult.rows[0];

        if (!supplier) {
            return null;
        }

        if (supplier.verified) {
            return { status: "already_verified" };
        }

        const pendingResult = await client.query(
            `
            SELECT id, status, submitted_at
            FROM supplier_verification_requests
            WHERE supplier_id = $1
              AND status = 'pending'
            LIMIT 1
            `,
            [supplierId]
        );

        if (pendingResult.rows[0]) {
            return {
                status: "pending",
                request: pendingResult.rows[0],
            };
        }

        const requestResult = await client.query(
            `
            INSERT INTO supplier_verification_requests (
                supplier_id,
                status
            )
            VALUES ($1, 'pending')
            RETURNING id, supplier_id, status, submitted_at
            `,
            [supplierId]
        );

        const request = requestResult.rows[0];

        for (const document of normalizedDocuments) {
            await client.query(
                `
                INSERT INTO supplier_verification_documents (
                    request_id,
                    public_id,
                    format,
                    resource_type
                )
                VALUES ($1, $2, $3, 'image')
                `,
                [
                    request.id,
                    document.publicId,
                    document.format,
                ]
            );
        }

        return {
            status: "submitted",
            request,
        };
    });
}

/**
 * Lists supplier verification requests for admin review.
 * Includes private document references for authorized admin use only.
 */
async function getVerificationRequestsForAdmin() {
    const result = await pool.query(`
        SELECT
            r.id,
            r.supplier_id,
            r.status,
            r.submitted_at,
            r.reviewed_by,
            r.reviewed_at,
            r.review_notes,
            s.verified AS supplier_verified,
            u.name AS supplier_name,
            u.email AS supplier_email
        FROM supplier_verification_requests r
        JOIN suppliers s ON s.id = r.supplier_id
        JOIN users u ON u.id = s.user_id
        ORDER BY
            CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
            r.submitted_at ASC,
            r.id ASC
    `);

    return result.rows;
}

/**
 * Returns documents for a single request.
 * Call only from an admin-protected controller.
 */
async function getVerificationDocumentsForAdmin(requestId) {
    const result = await pool.query(
        `
        SELECT id, request_id, public_id, format, resource_type
        FROM supplier_verification_documents
        WHERE request_id = $1
        ORDER BY id ASC
        `,
        [requestId]
    );

    return result.rows;
}

/**
 * Approves or rejects a pending supplier verification request.
 * Updates the supplier's verified flag only when approved.
 */
async function reviewVerificationRequest(requestId, adminId, status, notes = null) {
    if (!["approved", "rejected"].includes(status)) {
        throw new Error("Statut de vérification invalide.");
    }

    return withTransaction(pool, async (client) => {
        const requestResult = await client.query(
            `
            SELECT id, supplier_id, status
            FROM supplier_verification_requests
            WHERE id = $1
            FOR UPDATE
            `,
            [requestId]
        );

        const request = requestResult.rows[0];

        if (!request) {
            return { status: "not_found" };
        }

        if (request.status !== "pending") {
            return { status: "already_reviewed" };
        }

        await client.query(
            `
            UPDATE supplier_verification_requests
            SET status = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                review_notes = $3
            WHERE id = $4
            `,
            [status, adminId, notes, requestId]
        );

        await client.query(
            `
            UPDATE suppliers
            SET verified = $1,
                updated_at = NOW()
            WHERE id = $2
            `,
            [status === "approved", request.supplier_id]
        );

        return { status, requestId: request.id };
    });
}

module.exports = {
    getLatestVerificationRequest,
    submitVerificationRequest,
    getVerificationRequestsForAdmin,
    getVerificationDocumentsForAdmin,
    reviewVerificationRequest,
};
