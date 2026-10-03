(function() {
    window.initAddressAutocomplete = function(config) {
        const input = document.getElementById(config.inputId);
        const suggestions = document.getElementById(config.suggestionsId);
        const latitude = document.getElementById(config.latId);
        const longitude = document.getElementById(config.lngId);
        const addressText = config.addressTextId
            ? document.getElementById(config.addressTextId)
            : null;

        if (!input || !suggestions || !latitude || !longitude
            || (config.addressTextId && !addressText)) {
            throw new Error("Address autocomplete configuration references missing elements.");
        }

        let debounceTimer;
        let activeController;

        function closeSuggestions() {
            suggestions.replaceChildren();
            suggestions.style.display = "none";
        }

        input.addEventListener("input", function() {
            clearTimeout(debounceTimer);
            activeController?.abort();
            latitude.value = "";
            longitude.value = "";
            if (addressText) addressText.value = "";
            closeSuggestions();

            const query = input.value.trim();
            if (query.length < 3) return;

            debounceTimer = setTimeout(async function() {
                const controller = new AbortController();
                activeController = controller;
                try {
                    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
                        signal: controller.signal,
                    });
                    if (!response.ok) {
                        throw new Error(`Address lookup failed with status ${response.status}.`);
                    }
                    const places = await response.json();
                    if (!Array.isArray(places)) {
                        throw new TypeError("Geocoding response must be an array.");
                    }
                    if (controller.signal.aborted || input.value.trim() !== query) return;

                    places.forEach(function(place) {
                        if (!place || typeof place.display_name !== "string"
                            || !Number.isFinite(Number(place.lat))
                            || !Number.isFinite(Number(place.lng))) return;

                        const option = document.createElement("div");
                        option.className = "address-autocomplete-option";
                        option.setAttribute("role", "option");
                        option.tabIndex = 0;
                        option.textContent = place.display_name;
                        option.addEventListener("click", function() {
                            input.value = place.display_name;
                            latitude.value = place.lat;
                            longitude.value = place.lng;
                            if (addressText) addressText.value = place.display_name;
                            closeSuggestions();
                        });
                        option.addEventListener("keydown", function(event) {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                option.click();
                            }
                        });
                        suggestions.appendChild(option);
                    });

                    suggestions.style.display = suggestions.childElementCount > 0 ? "block" : "none";
                } catch (error) {
                    if (error.name !== "AbortError") {
                        console.error("Address autocomplete failed:", error);
                    }
                } finally {
                    if (activeController === controller) activeController = undefined;
                }
            }, 400);
        });

        document.addEventListener("click", function(event) {
            if (event.target !== input && !suggestions.contains(event.target)) {
                clearTimeout(debounceTimer);
                activeController?.abort();
                closeSuggestions();
            }
        });
    };
})();
