const ejs = require("ejs");
const path = require("path");

const searchTemplate = path.join(__dirname, "..", "views", "search", "results.ejs");

describe("nearby professional search view", () => {
    const sharedLocals = {
        lat: 6.37,
        lng: 2.39,
        filters: {},
        tradeCategories: [{
            label: "Bâtiment",
            trades: [
                "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Carrelage",
                "Menuiserie", "Toiture", "Climatisation", "Soudure", "Vitrerie",
                "Pavage", "Architecture",
            ],
        }],
    };

    test("explains how to start a nearby search", async () => {
        const html = await ejs.renderFile(searchTemplate, {
            ...sharedLocals,
            searched: false,
            professionals: [],
        });

        expect(html).toContain("Des professionnels près de vous");
        expect(html).toContain('id="location-input"');
        expect(html).toContain("Entrez votre adresse ou votre quartier");
        expect(html).toContain('id="search-location-button"');
        expect(html).toContain('aria-label="Rechercher cette adresse"');
        expect(html).toContain("Commencez par votre quartier");
        expect(html).not.toContain('id="filter-form"');
    });

    test("renders professional cards, filters, and map/list controls", async () => {
        const professionals = [{
            id: 17,
            name: "Awa Artisan",
            trade_category: "Plomberie",
            service_radius_km: 15,
            distance_km: 2.4,
            rating_avg: 4.8,
            review_count: 12,
            verified: true,
            photo_urls: [],
        }];
        const html = await ejs.renderFile(searchTemplate, {
            ...sharedLocals,
            searched: true,
            professionals,
            searchData: JSON.stringify({ clientLat: 6.37, clientLng: 2.39, professionals }),
        });

        expect(html).toContain('id="filter-form"');
        expect(html).toContain('id="selected-category"');
        expect(html).toContain('id="trade-picker-toggle"');
        expect(html).toMatch(/id="trade-picker-panel"[^>]*\shidden>/);
        expect(html).toContain('data-page-direction="-1"');
        expect(html).toContain('data-page-direction="1"');
        expect(html).toContain("/js/trade-pagination.js");
        expect(html).toContain('id="btn-list"');
        expect(html).toContain('id="btn-map"');
        expect(html).toContain("1 professionnel disponible");
        expect(html).toContain("Awa Artisan");
        expect(html).toContain("Profil vérifié");
        expect(html).toContain("4.8");
        expect(html).toContain("2.4 km de vous");
        expect(html).toContain('href="/requests/new/17"');
        expect(html).toContain('id="map-view"');
    });

    test("shows at most ten métiers per category and adds paging only where needed", async () => {
        const tradeCategories = [
            {
                label: "Catégorie longue",
                trades: Array.from({ length: 23 }, (_, index) => `Métier ${index + 1}`),
            },
            {
                label: "Petite catégorie",
                trades: ["Métier A", "Métier B"],
            },
        ];
        const html = await ejs.renderFile(searchTemplate, {
            ...sharedLocals,
            searched: true,
            professionals: [],
            tradeCategories,
        });
        const categories = [...html.matchAll(/<details class="nearby-trade-category"[\s\S]*?<\/details>/g)];

        expect(categories).toHaveLength(2);
        categories.forEach(([markup], index) => {
            const tradeButtons = [...markup.matchAll(/<button type="button"\s+class="nearby-trade-option[^"]*"[\s\S]*?>/g)];
            const initiallyVisible = tradeButtons.filter(([button]) => !/\shidden(?:\s|>)/.test(button));
            expect(initiallyVisible).toHaveLength(Math.min(10, tradeCategories[index].trades.length));
        });
        expect(categories[0][0]).toContain('data-page-direction="-1"');
        expect(categories[0][0]).toContain('data-page-direction="1"');
        expect(categories[0][0]).toContain("Page 1 sur 3");
        expect(categories[1][0]).not.toContain("nearby-trade-pagination");
    });

    test("shows the selected métier in the single collapsed picker", async () => {
        const html = await ejs.renderFile(searchTemplate, {
            ...sharedLocals,
            filters: { category: "Plomberie" },
            searched: true,
            professionals: [],
        });

        expect(html).toContain('<strong id="trade-picker-value">Plomberie</strong>');
        expect(html).toContain('id="trade-picker-toggle"');
        expect(html).toContain('aria-expanded="false"');
        expect(html).toMatch(/id="trade-picker-panel"[^>]*\shidden>/);
    });

    test("shows a useful empty state when there are no nearby professionals", async () => {
        const html = await ejs.renderFile(searchTemplate, {
            ...sharedLocals,
            filters: { category: "Plomberie" },
            searched: true,
            professionals: [],
        });

        expect(html).toContain("Aucun professionnel trouvé pour le moment");
        expect(html).toContain("Voir tous les métiers");
    });
});
