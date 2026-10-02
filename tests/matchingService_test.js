jest.mock("../models/professional-model", () => ({
    getUsersToNotifyForRequest: jest.fn(),
}));

jest.mock("../models/notification-model", () => ({
    createNotification: jest.fn(),
}));

const { getUsersToNotifyForRequest } = require("../models/professional-model");
const { createNotification } = require("../models/notification-model");
const { notifyProfessionalsForRequest } = require("../services/controllers/matchingService");

describe("notifyProfessionalsForRequest", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("notifies every matched professional and returns the match count", async () => {
        getUsersToNotifyForRequest.mockResolvedValue([
            { user_id: 12 },
            { user_id: 34 },
        ]);
        createNotification.mockResolvedValue(undefined);

        const count = await notifyProfessionalsForRequest({
            lat: "6.37",
            lng: "2.39",
            category: "Plomberie",
        });

        expect(getUsersToNotifyForRequest).toHaveBeenCalledWith("6.37", "2.39");
        expect(createNotification).toHaveBeenCalledTimes(2);
        expect(createNotification).toHaveBeenNthCalledWith(
            1,
            12,
            'Nouvelle demande "Plomberie" près de vous',
            "/professionals/leads"
        );
        expect(createNotification).toHaveBeenNthCalledWith(
            2,
            34,
            'Nouvelle demande "Plomberie" près de vous',
            "/professionals/leads"
        );
        expect(count).toBe(2);
    });

    test("returns zero and creates no notifications when no professionals match", async () => {
        getUsersToNotifyForRequest.mockResolvedValue([]);

        const count = await notifyProfessionalsForRequest({
            lat: "6.37",
            lng: "2.39",
            category: "Plomberie",
        });

        expect(count).toBe(0);
        expect(createNotification).not.toHaveBeenCalled();
    });

    test("propagates matching failures without creating notifications", async () => {
        const error = new Error("Database unavailable");
        getUsersToNotifyForRequest.mockRejectedValue(error);

        await expect(notifyProfessionalsForRequest({
            lat: "6.37",
            lng: "2.39",
            category: "Plomberie",
        })).rejects.toBe(error);
        expect(createNotification).not.toHaveBeenCalled();
    });

    test("propagates notification failures", async () => {
        getUsersToNotifyForRequest.mockResolvedValue([{ user_id: 12 }]);
        const error = new Error("Notification insert failed");
        createNotification.mockRejectedValue(error);

        await expect(notifyProfessionalsForRequest({
            lat: "6.37",
            lng: "2.39",
            category: "Plomberie",
        })).rejects.toBe(error);
    });
});