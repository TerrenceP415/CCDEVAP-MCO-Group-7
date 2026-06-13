// NOT SURE IF THIS WORKS
document.addEventListener('DOMContentLoaded', () => {
    const tripTypeRadios = document.querySelectorAll('input[name="trip_type"]');
    const returnDateInput = document.getElementById('return_date');
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');

    function updateReturnDateState() {
        const oneWaySelected = document.getElementById('one_way').checked;
        if (returnDateInput) {
            returnDateInput.disabled = oneWaySelected;
            if (oneWaySelected) {
                returnDateInput.value = '';
            }
        }
    }

    tripTypeRadios.forEach((radio) => {
        radio.addEventListener('change', updateReturnDateState);
    });
    updateReturnDateState();

    function syncAirports(changed, other) {
        if (!changed || !other) return;
        Array.from(other.options).forEach((option) => {
            option.disabled = option.value === changed.value;
        });
    }

    if (originSelect && destinationSelect) {
        originSelect.addEventListener('change', () => syncAirports(originSelect, destinationSelect));
        destinationSelect.addEventListener('change', () => syncAirports(destinationSelect, originSelect));
    }
});