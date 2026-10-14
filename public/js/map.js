
document.addEventListener("DOMContentLoaded", function () {
    const data = window.AZOODIE_SEARCH;
    if (!data) {
        console.error("AZOODIE_SEARCH is missing.");
        return;
    }

    const mapElement = document.getElementById("map");
    const listButton = document.getElementById("btn-list");
    const mapButton = document.getElementById("btn-map");
    const listView = document.getElementById("list-view");
    const mapView = document.getElementById("map-view");

    if (
        !window.L ||
        !mapElement ||
        !listButton ||
        !mapButton ||
        !listView ||
        !mapView
    ) {
        console.error("Search map could not be initialized: required elements are missing.");
        return;
    }

    function parseCoordinate(value) {
        if (value === null || value === undefined || value === "") {
            return NaN;
        }
        return Number(value);
    }

    const clientLat = parseCoordinate(data.clientLat);
    const clientLng = parseCoordinate(data.clientLng);

    if (
        !Number.isFinite(clientLat) ||
        !Number.isFinite(clientLng) ||
        clientLat < -90 ||
        clientLat > 90 ||
        clientLng < -180 ||
        clientLng > 180
    ) {
        console.error("Invalid client coordinates:", {
            latitude: data.clientLat,
            longitude: data.clientLng
        });
        return;
    }

    if (!Array.isArray(data.professionals)) {
        console.error("Professional data is invalid.");
        return;
    }

    // Keep professionals with valid coordinates even if distance_km is missing.
    const professionals = data.professionals
        .map(function (professional) {
            return {
                ...professional,
                latitude: parseCoordinate(professional.base_lat),
                longitude: parseCoordinate(professional.base_lng)
            };
        })
        .filter(function (professional) {
            const valid =
                Number.isFinite(professional.latitude) &&
                Number.isFinite(professional.longitude) &&
                professional.latitude >= -90 &&
                professional.latitude <= 90 &&
                professional.longitude >= -180 &&
                professional.longitude <= 180;

            if (!valid) {
                console.warn(
                    "Professional excluded: invalid coordinates",
                    professional.name,
                    professional.base_lat,
                    professional.base_lng
                );
            }

            return valid;
        });

    // Initialize map.
    const map = L.map(mapElement);
    window.AZOODIE_MAP = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const clientLocation = L.latLng(clientLat, clientLng);
    const markers = [];
    const routeLayers = L.layerGroup().addTo(map);

    // Client marker.
    const clientMarker = L.circleMarker(clientLocation, {
        radius: 12,
        fillColor: "#E8853B",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 1,
        pane: "markerPane"
    })
        .addTo(map)
        .bindPopup("Client — Vous êtes ici");

    markers.push(clientMarker);

    // Create professional markers and straight-line distance indicators.
    professionals.forEach(function (professional) {
        const realLocation = L.latLng(
            professional.latitude,
            professional.longitude
        );

        const distanceMeters = clientLocation.distanceTo(realLocation);
        const distanceKm = distanceMeters / 1000;

        // Visual offset only when the two locations are within 5 metres.
        // All calculations and routing continue to use real coordinates.
        const displayLocation = distanceMeters < 5
            ? L.latLng(
                professional.latitude + 0.00008,
                professional.longitude + 0.00008
            )
            : realLocation;

        const professionalMarker = L.circleMarker(displayLocation, {
            radius: 8,
            fillColor: "#16A34A",
            color: "#ffffff",
            weight: 2,
            fillOpacity: 1,
            pane: "markerPane"
        }).addTo(map);

        const popup = document.createElement("div");
        popup.textContent =
            `${professional.name || "Professionnel"} — ` +
            `${professional.trade_category || "Service"} — ` +
            `${distanceKm.toFixed(2)} km à vol d'oiseau`;

        professionalMarker.bindPopup(popup);
        markers.push(professionalMarker);

        // Show the real straight-line connection.
        const straightLine = L.polyline(
            [clientLocation, realLocation],
            {
                color: "#2563EB",
                weight: 3,
                dashArray: "6, 6"
            }
        ).addTo(map);

        // Keep the line behind the markers.
        straightLine.bringToBack();
    });

    // Frame all displayed markers. A single point needs a useful zoom.
    if (markers.length > 1) {
        const bounds = L.latLngBounds(
            markers.map(function (marker) {
                return marker.getLatLng();
            })
        );

        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15
        });
    } else {
        map.setView(clientLocation, 13);
    }

    // Select the nearest professional using actual coordinates.
    const nearest = professionals
        .map(function (professional) {
            const location = L.latLng(
                professional.latitude,
                professional.longitude
            );

            return {
                ...professional,
                calculatedDistance: clientLocation.distanceTo(location)
            };
        })
        .sort(function (a, b) {
            return a.calculatedDistance - b.calculatedDistance;
        })[0];

    // Request the real road route for the nearest professional.
    if (nearest) {
        const params = new URLSearchParams({
            originLat: String(clientLat),
            originLng: String(clientLng),
            destLat: String(nearest.latitude),
            destLng: String(nearest.longitude)
        });

        fetch(`/api/route?${params}`)
            .then(async function (response) {
                const routeData = await response.json();

                if (!response.ok) {
                    throw new Error(
                        routeData.error ||
                        `Route request failed with status ${response.status}.`
                    );
                }

                return routeData;
            })
            .then(function (routeData) {
                if (!routeData.geometry) {
                    console.warn("No route geometry returned.");
                    return;
                }

                const roadRoute = L.geoJSON(routeData.geometry, {
                    style: {
                        color: "#0F6E6E",
                        weight: 4,
                        opacity: 0.85
                    }
                }).addTo(routeLayers);

                roadRoute.bringToBack();

                if (Number.isFinite(Number(routeData.duration_s))) {
                    const minutes = Math.round(
                        Number(routeData.duration_s) / 60
                    );

                    L.popup()
                        .setLatLng([
                            nearest.latitude,
                            nearest.longitude
                        ])
                        .setContent(`Trajet réel : ${minutes} min`)
                        .openOn(map);
                }
            })
            .catch(function (error) {
                console.error("Route fetch failed:", error);
            });
    }

    // Switch to list view.
    listButton.addEventListener("click", function () {
        listView.style.display = "block";
        mapView.style.display = "none";

        listButton.classList.add("active");
        mapButton.classList.remove("active");

        listButton.setAttribute("aria-pressed", "true");
        mapButton.setAttribute("aria-pressed", "false");
    });

    // Switch to map view and recalculate its dimensions.
    mapButton.addEventListener("click", function () {
        listView.style.display = "none";
        mapView.style.display = "block";

        mapButton.classList.add("active");
        listButton.classList.remove("active");

        mapButton.setAttribute("aria-pressed", "true");
        listButton.setAttribute("aria-pressed", "false");

        requestAnimationFrame(function () {
            map.invalidateSize();

            if (markers.length > 1) {
                map.fitBounds(
                    L.latLngBounds(
                        markers.map(function (marker) {
                            return marker.getLatLng();
                        })
                    ),
                    {
                        padding: [40, 40],
                        maxZoom: 15
                    }
                );
            } else {
                map.setView(clientLocation, 13);
            }
        });
    });

    console.log("AZOODIE map initialized.", {
        clientCoordinates: [clientLat, clientLng],
        professionalsDisplayed: professionals.length
    });
});
