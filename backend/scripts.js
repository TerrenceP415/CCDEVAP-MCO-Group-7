var hamburger = document.querySelector('.hamburger');
var navLinks = document.querySelector('.nav-links');

// Guard added: on pages without a hamburger/nav-links element, the original
// code threw "Cannot read properties of null" because addEventListener was
// called on null, which silently broke the whole script (and anything
// after it) on those pages.
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}