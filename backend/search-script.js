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

    // ─── Passenger Stepper ──────────────────────────────────────────────
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

    // ─── Price Range Slider ─────────────────────────────────────────────
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

        // Prevent crossing
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