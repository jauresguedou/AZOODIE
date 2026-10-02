document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("location-input");
    const suggestionsBox = document.getElementById("suggestions");
    const searchButton = document.getElementById("search-location-button");
    const searchStatus = document.getElementById("location-search-status");

    if (!input || !suggestionsBox || !searchButton || !searchStatus) return;

    let debounceTimer;
    let activeController;
    let searchController;
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

    function validPlaces(places) {
        if (!Array.isArray(places)) {
            throw new TypeError("Geocoding response must be an array.");
        }

        return places.filter(function(place) {
            if (!place || typeof place.display_name !== "string"
                || place.lat == null || place.lng == null) return false;

            const latitude = Number(place.lat);
            const longitude = Number(place.lng);
            return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
                && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
        });
    }

    async function fetchPlaces(query, signal) {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal });
        if (!response.ok) {
            throw new Error(`Geocoding request failed with status ${response.status}.`);
        }
        return validPlaces(await response.json());
    }

    function goToPlace(place) {
        const params = new URLSearchParams({ lat: place.lat, lng: place.lng });
        window.location.href = `/search?${params}`;
    }

    function showSuggestions(places) {
        const fragment = document.createDocumentFragment();

        places.forEach(function(place) {
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
                goToPlace(place);
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

    async function searchAddress() {
        const query = input.value.trim();
        if (query.length < 3) {
            searchStatus.textContent = "Entrez au moins 3 caractères pour rechercher une adresse.";
            input.focus();
            return;
        }

        closeSuggestions();
        searchController?.abort();
        const controller = new AbortController();
        searchController = controller;
        searchButton.disabled = true;
        searchStatus.textContent = "Recherche de l’adresse…";

        try {
            const places = await fetchPlaces(query, controller.signal);
            if (places.length === 0) {
                searchStatus.textContent = "Adresse introuvable. Vérifiez votre saisie ou choisissez une suggestion.";
                return;
            }
            goToPlace(places[0]);
        } catch (error) {
            if (error.name !== "AbortError" && searchController === controller) {
                console.error("Address search failed:", error);
                searchStatus.textContent = "La recherche a échoué. Veuillez réessayer.";
            }
        } finally {
            if (searchController === controller) {
                searchButton.disabled = false;
                searchController = undefined;
            }
        }
    }

    searchButton.addEventListener("click", searchAddress);
    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchAddress();
        } else if (event.key === "Escape") {
            closeSuggestions();
        } else if (event.key === "ArrowDown") {
            suggestionsBox.querySelector("button")?.focus();
        }
    });

    input.addEventListener("input", function() {
        closeSuggestions();
        searchController?.abort();
        searchStatus.textContent = "";
        const query = input.value.trim();
        if (query.length < 3) return;

        const currentRequestId = requestId;
        debounceTimer = setTimeout(async function() {
            const controller = new AbortController();
            activeController = controller;

            try {
                const places = await fetchPlaces(query, controller.signal);
                if (controller.signal.aborted || currentRequestId !== requestId) return;

                showSuggestions(places);
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