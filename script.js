const header = document.querySelector(".site-header");

function updateHeader() {
    if (window.scrollY > 16) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

updateHeader();
window.addEventListener("scroll", updateHeader);

const revealElements = document.querySelectorAll(
    ".hero-copy, .dashboard-card, .trust-grid div, .section-copy, .feature-card, .step, .cta"
);

revealElements.forEach((element) => {
    element.classList.add("reveal");
});

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12
    }
);

revealElements.forEach((element) => {
    observer.observe(element);
});
