document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("location-input");
    const suggestionsBox = document.getElementById("suggestions");

    if(!input || !suggestionsBox) return;

    const params = new URLSearchParams(window.location.search);

    if (params.has("lat") && params.has("lng")) {


        localStorage.setItem("azoodie_last_location", JSON.stringify({
            lat: params.get("lat"),
            lng: params.get("lng"),

        }));

        }

        let debounceTimer;

        input.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            const query = input.value.trim();


            if (query.length < 3) {
                suggestionsBox.style.display = "none";
                return;
            }

            debounceTimer = setTimeout(async function () {

                const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
                const results = await response.json();

                if (results.length === 0) {
                    suggestionsBox.style.display = "none";
                    return;
                }

                suggestionsBox.innerHTML = "";

                results.forEach(function (place) {

                    const item = document.createElement("div");
                    item.textContent = place.display_name;
                    item.style.padding = "10px 14px";
                    item.style.cursor = "pointer";
                    item.style.borderBottom = "1px solid var(--gray-light)";

                    item.addEventListener("click", function() {
                        localStorage.setItem("azoodie_last_location", JSON.stringify({lat: place.lat, lng: place.lng}));
                        window.location.href = `/search?lat=${place.lat}&lng=${place.lng}`;
                    });
                    
                    suggestionsBox.appendChild(item);
        
                });

                suggestionsBox.style.display = "block";
            }, 400);
        });
        document.addEventListener("click", function(e) {

            if (!suggestionsBox.contains(e.target) && e.target !== input) {
                suggestionsBox.style.display = "none";
            }
        });

      });
        
        
