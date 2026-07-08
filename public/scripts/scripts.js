// Mobile nav toggle
var hamburger = document.querySelector('.hamburger');
var navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
} 

// Toast notifications for CRUD actions across admin pages
document.addEventListener('DOMContentLoaded', () => {
    const createButtons = document.querySelectorAll('.btnCreate');
    const saveButtons = document.querySelectorAll('.btnSave');
    const deleteButtons = document.querySelectorAll('.btnDelete');
    const toastContainer = document.getElementById('toastContainer');

    // Creates and shows a temporary toast message
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

    // Pre-fill search fields when arriving from homepage promo cards
    const urlParams = new URLSearchParams(window.location.search);
    const destinationCode = urlParams.get('destination');

    // Grab element references 
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');

    if (destinationCode ) {
        destinationSelect.value = destinationCode;
        // Set the default origin (Replace MNL with selected user default)
        originSelect.value = 'MNL';
        
        syncAirports(destinationSelect, originSelect); 
    }
});

document.getElementById('applyFilters').addEventListener('click', function() {
    const searchTerm = document.getElementById('searchReservations').value.toLowerCase();
    const filterStatus = document.getElementById('statusFilter').value;
    const cards = document.querySelectorAll('.reservation-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const status = card.querySelector('.badge').innerText.toLowerCase();
        
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = (filterStatus === 'all' || status.includes(filterStatus));

        card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
});