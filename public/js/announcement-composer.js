document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector(".announcement-composer-form");
    if (!form) return;

    const input = form.querySelector("#announcement-address");
    const latitude = form.querySelector('[name="lat"]');
    const longitude = form.querySelector('[name="lng"]');
    const suggestions = form.querySelector("#announcement-location-suggestions");
    const status = form.querySelector(".announcement-location-status");
    let debounceTimer;
    let activeController;

    function clearCoordinates() {
        latitude.value = "";
        longitude.value = "";
    }

    function closeSuggestions() {
        clearTimeout(debounceTimer);
        activeController?.abort();
        activeController = undefined;
        suggestions.replaceChildren();
        suggestions.hidden = true;
    }

    function selectPlace(place) {
        input.value = place.display_name;
        latitude.value = place.lat;
        longitude.value = place.lng;
        status.textContent = "Lieu sélectionné.";
        closeSuggestions();
    }

    input.addEventListener("input", function() {
        clearCoordinates();
        status.textContent = "";
        closeSuggestions();

        const query = input.value.trim();
        if (query.length < 3) return;

        debounceTimer = setTimeout(async function() {
            const controller = new AbortController();
            activeController = controller;
            try {
                const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}.`);
                const places = await response.json();
                if (controller.signal.aborted || input.value.trim() !== query) return;

                places.forEach(function(place) {
                    if (!place || typeof place.display_name !== "string"
                        || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lng))) return;

                    const option = document.createElement("button");
                    option.type = "button";
                    option.className = "announcement-location-option";
                    option.setAttribute("role", "option");
                    option.textContent = place.display_name;
                    option.addEventListener("click", function() {
                        selectPlace(place);
                    });
                    suggestions.appendChild(option);
                });
                suggestions.hidden = suggestions.childElementCount === 0;
                status.textContent = suggestions.hidden
                    ? "Aucune adresse trouvée. Essayez une ville ou un quartier proche."
                    : "Choisissez une adresse dans la liste.";
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Announcement location lookup failed:", error);
                    status.textContent = "La recherche d’adresse a échoué. Veuillez réessayer.";
                }
            } finally {
                if (activeController === controller) activeController = undefined;
            }
        }, 350);
    });

    form.addEventListener("submit", function(event) {
        if (!latitude.value || !longitude.value) {
            event.preventDefault();
            status.textContent = "Sélectionnez un lieu dans les suggestions pour publier l’annonce.";
            input.focus();
        }
    });
});
