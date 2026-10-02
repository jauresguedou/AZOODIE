document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));

    if (params.has("lat") && params.has("lng")
        && Number.isFinite(lat) && lat >= -90 && lat <= 90
        && Number.isFinite(lng) && lng >= -180 && lng <= 180) {
        localStorage.setItem("azoodie_last_location", JSON.stringify({
            lat: params.get("lat"),
            lng: params.get("lng"),
        }));
    }
});
