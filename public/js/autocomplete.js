document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("location-input");
    const suggestionsBox = document.getElementById("suggestions");

    if (!input || !suggestionsBox) return;

    let debounceTimer;
    let activeController;
    let requestId = 0;

    function closeSuggestions() {
        clearTimeout(debounceTimer);
        requestId += 1;
        activeController?.abort();
        activeController = undefined;
        suggestionsBox.replaceChildren();
        suggestionsBox.style.display = "none";
        input.setAttribute("aria-expanded", "false");
    }

    function showSuggestions(places) {
        const fragment = document.createDocumentFragment();

        places.forEach(function(place) {
            if (place.lat == null || place.lng == null) return;

            const latitude = Number(place.lat);
            const longitude = Number(place.lng);
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
                || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return;

            const item = document.createElement("button");
            item.type = "button";
            item.setAttribute("role", "option");
            item.textContent = place.display_name;
            item.style.display = "block";
            item.style.width = "100%";
            item.style.padding = "10px 14px";
            item.style.textAlign = "left";
            item.style.background = "#fff";
            item.style.border = "0";
            item.style.borderBottom = "1px solid var(--gray-light)";
            item.style.cursor = "pointer";

            item.addEventListener("click", function() {
                const params = new URLSearchParams({ lat: place.lat, lng: place.lng });
                window.location.href = `/search?${params}`;
            });

            fragment.appendChild(item);
        });

        suggestionsBox.replaceChildren(fragment);
        const hasSuggestions = suggestionsBox.childElementCount > 0;
        suggestionsBox.style.display = hasSuggestions ? "block" : "none";
        input.setAttribute("aria-expanded", String(hasSuggestions));
    }

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", suggestionsBox.id);
    input.setAttribute("aria-expanded", "false");
    suggestionsBox.setAttribute("role", "listbox");

    input.addEventListener("input", function() {
        closeSuggestions();
        const query = input.value.trim();
        if (query.length < 3) return;

        const currentRequestId = requestId;
        debounceTimer = setTimeout(async function() {
            const controller = new AbortController();
            activeController = controller;

            try {
                const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`Geocoding request failed with status ${response.status}.`);
                }

                const places = await response.json();
                if (!Array.isArray(places)) {
                    throw new TypeError("Geocoding response must be an array.");
                }
                if (controller.signal.aborted || currentRequestId !== requestId) return;

                showSuggestions(places.filter((place) =>
                    place && typeof place.display_name === "string"
                ));
            } catch (error) {
                if (error.name !== "AbortError" && currentRequestId === requestId) {
                    console.error("Geocoding request failed:", error);
                    closeSuggestions();
                }
            } finally {
                if (activeController === controller) {
                    activeController = undefined;
                }
            }
        }, 400);
    });

    input.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeSuggestions();
        } else if (event.key === "ArrowDown") {
            suggestionsBox.querySelector("button")?.focus();
        }
    });

    suggestionsBox.addEventListener("keydown", function(event) {
        const items = Array.from(suggestionsBox.querySelectorAll("button"));
        const currentIndex = items.indexOf(document.activeElement);

        if (event.key === "Escape") {
            closeSuggestions();
            input.focus();
        } else if (event.key === "ArrowDown" && currentIndex < items.length - 1) {
            event.preventDefault();
            items[currentIndex + 1].focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (currentIndex <= 0) {
                input.focus();
            } else {
                items[currentIndex - 1].focus();
            }
        }
    });

    document.addEventListener("click", function(event) {
        if (!suggestionsBox.contains(event.target) && event.target !== input) {
            closeSuggestions();
        }
    });
});