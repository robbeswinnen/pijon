// ==========================================================
// PIJON
// script.js
// Small polish: navbar state + entrance animations
// ==========================================================

const header = document.querySelector("header");

function updateHeader() {
    if (window.scrollY > 24) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

updateHeader();
window.addEventListener("scroll", updateHeader);


// Fade elements in when they enter the screen

const animatedElements = document.querySelectorAll(
    ".hero-text, .hero-image, .card, .about .container"
);

animatedElements.forEach((element) => {
    element.classList.add("reveal");
});

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    },
    {
        threshold: 0.15
    }
);

animatedElements.forEach((element) => {
    observer.observe(element);
});
