document.addEventListener("DOMContentLoaded", function() {
    const toggleButtons = document.querySelectorAll("[data-password-toggle]");

    toggleButtons.forEach(function (button) {
        const input = document.getElementById(button.dataset.passwordToggle);

        button.addEventListener("click", function() {
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";

            const icon = button.querySelector("svg");

            if(isHidden) {
                icon.innerHTML = `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06"></path>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.22 4.66"></path>
                <path d="M1 1l22 22"></path>
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>`;
                button.setAttribute("aria-label", "Masquer le mot de passe");
            } else {
                icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>`;
                    button.setAttribute("aria-label", "Afficher le mot de passe");
            }
        });
    });
});