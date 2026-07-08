// Search page: trip type toggling, airport sync, date validation, passenger steppers, and price slider
document.addEventListener('DOMContentLoaded', () => {
    const tripTypeRadios = document.querySelectorAll('input[name="trip_type"]');
    const returnDateInput = document.getElementById('return_date');
    const departureDateInput = document.getElementById('departure_date');
    const originSelect = document.getElementById('origin');
    const destinationSelect = document.getElementById('destination');
    const returnDateError = document.getElementById('return-date-error');
    const searchForm = document.getElementById('searchForm');

    // Disable return date field when "One Way" is selected
    function updateReturnDateState() {
        const oneWaySelected = document.getElementById('one_way').checked;
        if (returnDateInput) {
            returnDateInput.disabled = oneWaySelected;
            if (oneWaySelected) {
                returnDateInput.value = '';
                // Clear any date error when switching to one-way
                if (returnDateError) returnDateError.style.display = 'none';
            }
        }
    }

    tripTypeRadios.forEach((radio) => {
        radio.addEventListener('change', updateReturnDateState);
    });
    updateReturnDateState();

    // Prevents picking the same airport for origin and destination
    function syncAirports(changed, other) {
        if (!changed || !other) return;
        // First, re-enable ALL options in the other select
        Array.from(other.options).forEach((option) => {
            option.disabled = false;
        });
        // Then disable only the matching option
        Array.from(other.options).forEach((option) => {
            if (option.value === changed.value) {
                option.disabled = true;
            }
        });
    }

    if (originSelect && destinationSelect) {
        originSelect.addEventListener('change', () => syncAirports(originSelect, destinationSelect));
        destinationSelect.addEventListener('change', () => syncAirports(destinationSelect, originSelect));
        // Run sync on page load for initial state (origin only)
        syncAirports(originSelect, destinationSelect);
    }

    // Return date must be after departure date
    function validateDates() {
        if (!departureDateInput || !returnDateInput || !returnDateError) return true;
        // Skip validation if one-way or return date not set
        if (returnDateInput.disabled || !returnDateInput.value || !departureDateInput.value) {
            returnDateError.style.display = 'none';
            return true;
        }
        const depDate = new Date(departureDateInput.value);
        const retDate = new Date(returnDateInput.value);
        if (retDate <= depDate) {
            returnDateError.style.display = 'block';
            return false;
        }
        returnDateError.style.display = 'none';
        return true;
    }

    if (departureDateInput) {
        departureDateInput.addEventListener('change', validateDates);
    }
    if (returnDateInput) {
        returnDateInput.addEventListener('change', validateDates);
    }

    // Prevent form submission if date validation fails
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            if (!validateDates()) {
                e.preventDefault();
                returnDateInput.focus();
            }
        });
    }

    // +/- buttons for Adults, Children, Infants counts
    document.querySelectorAll('.pax-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            let val = parseInt(input.value) || 0;
            const min = parseInt(input.min) || 0;
            const max = parseInt(input.max) || 9;

            if (btn.classList.contains('pax-plus') && val < max) {
                input.value = val + 1;
            } else if (btn.classList.contains('pax-minus') && val > min) {
                input.value = val - 1;
            }

            // Update disabled states
            updateStepperStates();
        });
    });

    // Grey out +/- buttons when at their min/max limits
    function updateStepperStates() {
        document.querySelectorAll('.pax-stepper').forEach(stepper => {
            const input = stepper.querySelector('input');
            const minBtn = stepper.querySelector('.pax-minus');
            const plusBtn = stepper.querySelector('.pax-plus');
            if (!input || !minBtn || !plusBtn) return;
            const val = parseInt(input.value) || 0;
            minBtn.classList.toggle('disabled', val <= parseInt(input.min));
            plusBtn.classList.toggle('disabled', val >= parseInt(input.max));
        });
    }
    updateStepperStates();

    // Dual-thumb price range slider in advanced options
    const priceMin = document.getElementById('price_min');
    const priceMax = document.getElementById('price_max');
    const priceTrack = document.getElementById('price-slider-track');
    const priceMinLabel = document.getElementById('price-min-label');
    const priceMaxLabel = document.getElementById('price-max-label');

    function formatPeso(n) {
        return '$' + Number(n).toLocaleString();
    }

    function updatePriceSlider() {
        if (!priceMin || !priceMax) return;
        let lo = parseInt(priceMin.value);
        let hi = parseInt(priceMax.value);
        const total = parseInt(priceMin.max);

        // Swap values if handles cross each other
        if (lo > hi) {
            [lo, hi] = [hi, lo];
            priceMin.value = lo;
            priceMax.value = hi;
        }

        const pctLo = (lo / total) * 100;
        const pctHi = (hi / total) * 100;

        if (priceTrack) {
            priceTrack.style.left = pctLo + '%';
            priceTrack.style.width = (pctHi - pctLo) + '%';
        }
        if (priceMinLabel) priceMinLabel.textContent = formatPeso(lo);
        if (priceMaxLabel) priceMaxLabel.textContent = formatPeso(hi);
    }

    if (priceMin && priceMax) {
        priceMin.addEventListener('input', updatePriceSlider);
        priceMax.addEventListener('input', updatePriceSlider);
        updatePriceSlider();
    }
});

//Condition for departure time and arrival time if the flight is on different date
