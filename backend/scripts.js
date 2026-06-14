// Enable Mobile Hamburger Menu on Click
var hamburger = document.querySelector('.hamburger');
var navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
} 

// Toast Notification handler
document.addEventListener('DOMContentLoaded', () => {
    const createButtons = document.querySelectorAll('.btnCreate');
    const saveButtons = document.querySelectorAll('.btnSave');
    const deleteButtons = document.querySelectorAll('.btnDelete');
    const toastContainer = document.getElementById('toastContainer');

    // Takes in a message string variable and generates and display a toast notification
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

    // Attach listeners to all create buttons and call showToast with relevant message
    createButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Creation successful!'));
    });

    // Attach listeners to all save buttons and call showToast with relevant message
    saveButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Changes Saved!'));
    });

    // Attach listeners to all delete buttons and call showToast with relevant message
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => showToast('Entry Deleted Successfully!'));
    });
});