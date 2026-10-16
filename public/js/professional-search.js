
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("professionalSearch");
    const searchStatus = document.getElementById(
        "professionalSearchStatus"
    );
    const cards = Array.from(
        document.querySelectorAll(".professionals-grid .professional-card")
    );

    if (!searchInput || !searchStatus) return;

    const normalize = (value) =>
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase()
            .trim();

    searchInput.addEventListener("input", () => {
        const query = normalize(searchInput.value);
        let visibleCount = 0;

        cards.forEach((card) => {
            const name = card.querySelector(
                ".professional-card-info h2"
            );

            const professionalName = normalize(
                name?.textContent || ""
            );

            const matches = professionalName.includes(query);

            card.hidden = !matches;

            if (matches) visibleCount++;
        });

        if (query === "") {
            searchStatus.textContent = "";
        } else if (visibleCount === 0) {
            searchStatus.textContent =
                "Aucun professionnel trouvé pour ce nom.";
        } else {
            searchStatus.textContent =
                `${visibleCount} professionnel${visibleCount > 1 ? "s" : ""} trouvé${visibleCount > 1 ? "s" : ""}.`;
        }
    });
});
