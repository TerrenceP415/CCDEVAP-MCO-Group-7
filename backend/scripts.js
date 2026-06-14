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

document.addEventListener('DOMContentLoaded', () => {
    const createButtons = document.querySelectorAll('.btnCreate');
    const saveButtons = document.querySelectorAll('.btnSave');
    const deleteButtons = document.querySelectorAll('.btnDelete');
    const toastContainer = document.getElementById('toastContainer');

    // Helper function to generate and display a toast notification
    function showToast(message) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3500);
    }

    // Attach listeners to all Create buttons
    createButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Creation successful!'));
    });

    // Attach listeners to all Save buttons
    saveButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Changes Saved!'));
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Entry Deleted Successfully!'));
    });
});