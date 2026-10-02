const serializeInlineJson = require("../utils/serializeInlineJson");

describe("serializeInlineJson", () => {
    test("preserves JSON values while escaping script-breaking characters", () => {
        const value = {
            clientLat: 6.37,
            professionals: [{
                name: '</script><script>alert("xss")</script>',
                trade_category: "Artisan & Fils",
                note: "line\u2028separator\u2029",
            }],
        };
        const serialized = serializeInlineJson(value);
        const parsed = JSON.parse(serialized);

        expect(parsed).toEqual(value);
        expect(serialized).not.toContain("<");
        expect(serialized).not.toContain(">");
        expect(serialized).not.toContain("&");
        expect(serialized).not.toContain("\u2028");
        expect(serialized).not.toContain("\u2029");
        expect(serialized).toContain("\\u003c/script\\u003e");
    });
});
