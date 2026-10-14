document.addEventListener("DOMContentLoaded", function() {
    const data = window.AZOODIE_SEARCH;
    if (!data) return;

    const mapElement = document.getElementById("map");
    const listButton = document.getElementById("btn-list");
    const mapButton = document.getElementById("btn-map");
    const listView = document.getElementById("list-view");
    const mapView = document.getElementById("map-view");

    if (!window.L || !mapElement || !listButton || !mapButton || !listView || !mapView) {
        console.error("Search map could not be initialized: required map elements are missing.");
        return;
    }

    const clientLat = Number(data.clientLat);
    const clientLng = Number(data.clientLng);
    if (!Number.isFinite(clientLat) || !Number.isFinite(clientLng)) {
        console.error("Search map could not be initialized: client coordinates are invalid.");
        return;
    }

    if (!Array.isArray(data.professionals)) {
        console.error("Search map could not be initialized: professional data is invalid.");
        return;
    }

    const professionals = data.professionals
        .map(function(professional) {
            return {
                ...professional,
                latitude: Number(professional.base_lat),
                longitude: Number(professional.base_lng),
                distance: Number(professional.distance_km),
            };
        })
        .filter(function(professional) {
            return Number.isFinite(professional.latitude)
                && Number.isFinite(professional.longitude)
                && Number.isFinite(professional.distance);
        });

    
const map = L.map(mapElement);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Display the client
const markers = [];

const clientMarker = L.circleMarker([clientLat, clientLng], {
    radius: 10,
    fillColor: "#E8853B",
    color: "#fff",
    weight: 2,
    fillOpacity: 1,
}).addTo(map).bindPopup("Vous êtes ici");

markers.push(clientMarker);

// Display every professional with valid coordinates in Benin.
// Adjust the geographic bounds if AZÔÔDIÉ expands to other countries.
professionals.forEach(function(professional) {
    const { latitude, longitude, distance } = professional;

    if (
        latitude < 6 || latitude > 13 ||
        longitude < 0 || longitude > 5 ||
        !Number.isFinite(distance) ||
        distance < 0
    ) {
        console.warn(
            "Professional excluded because coordinates are invalid for Benin:",
            professional.name,
            latitude,
            longitude
        );
        return;
    }

    const popup = document.createElement("div");
    popup.textContent =
        `${professional.name} — ${professional.trade_category} ` +
        `(${distance.toFixed(1)} km à vol d'oiseau)`;

    const marker = L.circleMarker([latitude, longitude], {
        radius: 9,
        fillColor: "#0F6E6E",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
    }).addTo(map).bindPopup(popup);

    markers.push(marker);
});

// Automatically frame the client and all displayed professionals.
const bounds = L.latLngBounds(
    markers.map(marker => marker.getLatLng())
);

if (bounds.isValid()) {
    map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 13,
    });
}


    const nearest = professionals[0];
    if (nearest) {
        const params = new URLSearchParams({
            originLat: clientLat,
            originLng: clientLng,
            destLat: nearest.latitude,
            destLng: nearest.longitude,
        });

        fetch(`/api/route?${params}`)
            .then(async function(response) {
                const routeData = await response.json();
                if (!response.ok) {
                    throw new Error(routeData.error || `Route request failed with status ${response.status}.`);
                }
                return routeData;
            })
            .then(function(routeData) {
                if (!routeData.geometry) return;

                L.geoJSON(routeData.geometry, {
                    style: { color: "#0F6E6E", weight: 4 },
                }).addTo(map);

                const durationSeconds = Number(routeData.duration_s);
                if (Number.isFinite(durationSeconds)) {
                    const minutes = Math.round(durationSeconds / 60);
                    L.popup()
                        .setLatLng([nearest.latitude, nearest.longitude])
                        .setContent(`Trajet réel: ${minutes} min`)
                        .openOn(map);
                }
            })
            .catch(function(error) {
                console.error("Route fetch failed:", error);
            });
    }

    listButton.addEventListener("click", function() {
        listView.style.display = "block";
        mapView.style.display = "none";
        listButton.classList.add("active");
        mapButton.classList.remove("active");
        listButton.setAttribute("aria-pressed", "true");
        mapButton.setAttribute("aria-pressed", "false");
    });

    mapButton.addEventListener("click", function() {
        listView.style.display = "none";
        mapView.style.display = "block";
        mapButton.classList.add("active");
        listButton.classList.remove("active");
        mapButton.setAttribute("aria-pressed", "true");
        listButton.setAttribute("aria-pressed", "false");
        requestAnimationFrame(function() {
            map.invalidateSize();
        });
    });
});
