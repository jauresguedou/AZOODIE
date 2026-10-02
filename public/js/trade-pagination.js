document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("filter-form");
    const selectedCategory = document.getElementById("selected-category");
    const pickerToggle = document.getElementById("trade-picker-toggle");
    const pickerPanel = document.getElementById("trade-picker-panel");
    const pickerValue = document.getElementById("trade-picker-value");
    if (!form || !selectedCategory || !pickerToggle || !pickerPanel || !pickerValue) return;

    const pageSize = 10;

    function setPickerOpen(isOpen) {
        pickerToggle.setAttribute("aria-expanded", String(isOpen));
        pickerPanel.hidden = !isOpen;
    }

    pickerToggle.addEventListener("click", function() {
        setPickerOpen(pickerToggle.getAttribute("aria-expanded") !== "true");
    });

    pickerToggle.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            setPickerOpen(false);
        }
    });

    document.addEventListener("click", function(event) {
        if (!pickerPanel.contains(event.target) && !pickerToggle.contains(event.target)) {
            setPickerOpen(false);
        }
    });

    form.querySelectorAll(".nearby-trade-category").forEach(function(category) {
        const trades = Array.from(category.querySelectorAll(".nearby-trade-option"));
        const pagination = category.querySelector(".nearby-trade-pagination");
        if (!pagination || trades.length <= pageSize) return;

        const previousButton = pagination.querySelector('[data-page-direction="-1"]');
        const nextButton = pagination.querySelector('[data-page-direction="1"]');
        const status = pagination.querySelector(".nearby-trade-page-status");
        const pageCount = Math.ceil(trades.length / pageSize);
        let currentPage = 0;

        function renderPage() {
            const firstVisible = currentPage * pageSize;
            trades.forEach(function(trade, index) {
                trade.hidden = index < firstVisible || index >= firstVisible + pageSize;
            });
            previousButton.disabled = currentPage === 0;
            nextButton.disabled = currentPage === pageCount - 1;
            status.textContent = `Page ${currentPage + 1} sur ${pageCount}`;
        }

        previousButton.addEventListener("click", function() {
            if (currentPage === 0) return;
            currentPage -= 1;
            renderPage();
        });

        nextButton.addEventListener("click", function() {
            if (currentPage >= pageCount - 1) return;
            currentPage += 1;
            renderPage();
        });

        renderPage();
    });

    form.querySelectorAll(".nearby-trade-option").forEach(function(tradeButton) {
        tradeButton.addEventListener("click", function() {
            selectedCategory.value = tradeButton.dataset.trade;
            pickerValue.textContent = tradeButton.dataset.trade;
            form.requestSubmit();
        });
    });
});
