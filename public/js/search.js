document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("location-input");
    const button = document.getElementById("location-submit");

    if(!input || !button) return;

    const params = new URLSearchParams(window.location.search);
    const hasCoordsInUrl = params.has("lat") && params.has("lng");

    const saved = localStorage.getItem("azoodie_last_location");

    if (hasCoordsInUrl) {

        localStorage.setItem("azoodie_last_location", JSON.stringify({
            lat: params.get("lat"),
            lng: params.get("lng"),

        }));

        if (saved) {
            const { lat, lng } = JSON.parse(saved);
            input.value = `${lat}, ${lng}`;
        } else {
            input.value = `${params.get("lat")}, ${params.get("lng")}`;
            }
        } else if (saved) {
            const { lat, lng } = JSON.parse(saved);
            input.value = `${lat}, ${lng}`;
        }

        button.addEventListener("click", function() {
            const parts = input.value.split(",").map(s => s.trim());
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
                alert("Format attendu: latitude, longitude (ex: 6.3700, 2.3900")
                return;
            }
            window.location.href = `/search?lat=${parts[0]}&lng=${parts[1]};`
        });
    });
