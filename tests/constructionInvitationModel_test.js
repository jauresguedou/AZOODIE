jest.mock("../config/database", () => ({
    query: jest.fn()
}));

const pool = require("../config/database");
const {
    createInvitation,
    getPendingInvitations,
    respondToInvitation,
    revokeMember,
    getProjectMembers
} = require("../models/construction-invitation-model");

describe("Construction invitation model", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("creates a pending invitation for an existing user", async () => {
        pool.query.mockResolvedValue({
            rows: [{
                id: 10,
                project_id: 5,
                user_id: 8,
                member_role: "site_manager",
                invitation_status: "pending"
            }]
        });

        const result = await createInvitation(
            1, 5, "manager@example.com", "site_manager"
        );

        expect(result.invitation_status).toBe("pending");
        expect(pool.query).toHaveBeenCalledTimes(1);

        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("p.owner_id = $1");
        expect(sql).toContain("LOWER(TRIM(u.email))");
        expect(sql).toContain("'pending'");
        expect(params).toEqual([
            1, 5, "manager@example.com", "site_manager"
        ]);
    });

    test("rejects an unsupported member role without querying the database", async () => {
        await expect(
            createInvitation(1, 5, "user@example.com", "owner")
        ).rejects.toThrow("Invalid construction project member role.");

        expect(pool.query).not.toHaveBeenCalled();
    });

    test("returns null when no invitation can be created", async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const result = await createInvitation(
            1, 5, "missing@example.com", "viewer"
        );

        expect(result).toBeNull();
    });

    test("lists pending invitations for the recipient", async () => {
        pool.query.mockResolvedValue({
            rows: [{ membership_id: 10, invitation_status: "pending" }]
        });

        const result = await getPendingInvitations(8);

        expect(result).toHaveLength(1);
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("m.user_id = $1");
        expect(sql).toContain("m.invitation_status = 'pending'");
        expect(params).toEqual([8]);
    });

    test("accepts or declines only valid decisions", async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 10, invitation_status: "accepted" }]
        });

        const result = await respondToInvitation(10, 8, "accepted");

        expect(result.invitation_status).toBe("accepted");
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("m");
        expect(sql).toContain("invitation_status = 'pending'");
        expect(params).toEqual([10, 8, "accepted"]);

        pool.query.mockClear();

        await expect(
            respondToInvitation(10, 8, "owner")
        ).rejects.toThrow("Invalid invitation decision.");

        expect(pool.query).not.toHaveBeenCalled();
    });

    test("returns null if the invitation was already handled", async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const result = await respondToInvitation(10, 8, "declined");

        expect(result).toBeNull();
    });

    test("revokes membership only when the project belongs to the owner", async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 10, invitation_status: "revoked" }]
        });

        const result = await revokeMember(1, 5, 10);

        expect(result.invitation_status).toBe("revoked");
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("p.owner_id = $1");
        expect(sql).toContain("m.invitation_status IN ('pending', 'accepted')");
        expect(params).toEqual([1, 5, 10]);
    });

    test("lists project members only for the owner", async () => {
        pool.query.mockResolvedValue({
            rows: [{ membership_id: 10, member_role: "viewer" }]
        });

        const result = await getProjectMembers(1, 5);

        expect(result).toHaveLength(1);
        const [sql, params] = pool.query.mock.calls[0];
        expect(sql).toContain("p.owner_id = $1");
        expect(params).toEqual([1, 5]);
    });
});
