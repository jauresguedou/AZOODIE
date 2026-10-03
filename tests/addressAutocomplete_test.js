const ejs = require("ejs");
const path = require("path");

describe("address autocomplete forms", () => {
    const professionals = path.join(__dirname, "..", "views", "professionals");
    const formValues = {};
    const professional = {
        id: 12,
        name: "Awa Artisan",
        trade_category: "Menuisier bois",
        service_radius_km: 15,
        address_text: "Cotonou",
        base_lat: "6.3703",
        base_lng: "2.3912",
        availability_status: "available",
    };

    test("professional creation submits selected address and hidden coordinates", async () => {
        const html = await ejs.renderFile(path.join(professionals, "add-form.ejs"), { formValues });

        expect(html).toContain('id="address_input"');
        expect(html).toContain('id="address_suggestions"');
        expect(html).toContain('type="hidden" id="address_text" name="address_text"');
        expect(html).toContain('type="hidden" id="base_lat" name="base_lat"');
        expect(html).toContain('type="hidden" id="base_lng" name="base_lng"');
        expect(html).toContain('src="/js/address-autocomplete.js"');
        expect(html).not.toMatch(/<input[^>]+name="base_lat"[^>]*type="text"/);
        expect(html).not.toMatch(/<input[^>]+name="base_lng"[^>]*type="text"/);
    });

    test("professional edit pre-fills the readable address and stored coordinates", async () => {
        const html = await ejs.renderFile(path.join(professionals, "edit-form.ejs"), {
            professional,
            formValues: {},
            errors: [],
        });

        expect(html).toContain('id="address_input" value="Cotonou"');
        expect(html).toContain('id="address_text" name="address_text" value="Cotonou"');
        expect(html).toContain('id="base_lat" name="base_lat" value="6.3703"');
        expect(html).toContain('id="base_lng" name="base_lng" value="2.3912"');
    });

    test("contact request uses its existing address and coordinate parameter names", async () => {
        const html = await ejs.renderFile(path.join(__dirname, "..", "views", "requests", "contact-form.ejs"), {
            professional,
            formValues: {},
            errors: [],
        });

        expect(html).toContain('id="address_input"');
        expect(html).toContain('type="hidden" id="address_text" name="address_text"');
        expect(html).toContain('type="hidden" id="lat" name="lat"');
        expect(html).toContain('type="hidden" id="lng" name="lng"');
        expect(html).toContain('latId: "lat"');
        expect(html).toContain('lngId: "lng"');
    });
});
