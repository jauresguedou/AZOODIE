document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.querySelector('.nav-links');

    if(!toggle || !links) return;

    toggle.addEventListener('click', function() {
        const isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    window.addEventListener('resize',  function() {
        if (window.innerWidth > 768) {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
})