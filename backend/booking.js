$(function () {
    // ---------- Selected flight (dummy — would come from search results) ----------
    var flight = (typeof sampleFlights !== "undefined") ? sampleFlights[2] : {
        airlineName: "SkyEase Airways",
        flightNumber: "PS-882",
        origin: "MNL",
        destination: "NRT",
        departureTime: "06:00 AM",
        arrivalTime: "11:30 AM",
        duration: "4h 30m",
        class: "Business",
        price: 450.00
    };

    $("#summaryRoute").text(flight.origin + " \u2192 " + flight.destination);
    $("#summaryAirline").text(flight.airlineName + " \u00b7 " + flight.flightNumber);
    $("#summaryTime").text(flight.departureTime + " - " + flight.arrivalTime + " (" + flight.duration + ")");
    $("#summaryClass").text(flight.class);

    var basePrice = flight.price;

    // ---------- State ----------
    var state = {
        seat: null,
        seatPrice: 0,
        meal: "M01",
        mealPrice: 0,
        baggage: 0,
        priorityBoarding: false,
        travelInsurance: false,
        loungeAccess: false
    };

    var BAGGAGE_PRICE = 25;
    var PRIORITY_PRICE = 15;
    var INSURANCE_PRICE = 20;
    var LOUNGE_PRICE = 35;
    var TAX_RATE = 0.12;

    // ---------- Meal package selection ----------
    var $mealOptions = $("#mealOptions");
    var meals = (typeof mealPackages !== "undefined") ? mealPackages : [
        { id: "M01", name: "Standard Meal", description: "Chef's selection hot meal with beverage", price: 0.00 }
    ];

    meals.forEach(function (meal) {
        var $option = $(
            '<div class="meal-option" data-id="' + meal.id + '" data-price="' + meal.price + '" tabindex="0" role="button" aria-pressed="false">' +
                '<span class="meal-name">' + meal.name + '</span>' +
                '<span class="meal-desc">' + meal.description + '</span>' +
                '<span class="meal-price">' + (meal.price > 0 ? "+$" + meal.price.toFixed(2) : "Included") + '</span>' +
            '</div>'
        );
        $mealOptions.append($option);
    });

    function selectMeal($el) {
        $mealOptions.find(".meal-option").removeClass("selected").attr("aria-pressed", "false");
        $el.addClass("selected").attr("aria-pressed", "true");
        state.meal = $el.data("id");
        state.mealPrice = parseFloat($el.data("price")) || 0;
        updateSummary();
    }

    $mealOptions.on("click", ".meal-option", function () {
        selectMeal($(this));
    });
    $mealOptions.on("keydown", ".meal-option", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectMeal($(this));
        }
    });
    // Default to Standard Meal
    selectMeal($mealOptions.find('.meal-option[data-id="M01"]'));

    // ---------- Seat map ----------
    var rows = 6;
    var cols = ["A", "B", "C", "D", "E", "F"];
    var occupied = ["1C", "1D", "2A", "3F", "4B", "4C", "5E", "6A"];
    var $seatMap = $("#seatMap");

    for (var r = 1; r <= rows; r++) {
        var $row = $('<div class="seat-row"></div>');
        $row.append('<div class="row-label">' + r + '</div>');

        cols.forEach(function (col, i) {
            var seatId = r + col;
            var isPremium = r <= 2;
            var isOccupied = occupied.indexOf(seatId) !== -1;

            var classes = "seat";
            if (isOccupied) classes += " occupied";
            else if (isPremium) classes += " premium";

            var title = isOccupied
                ? "Seat " + seatId + " - Occupied"
                : "Seat " + seatId + (isPremium ? " - Premium (+$30)" : " - Standard");

            var $seat = $('<div class="' + classes + '" data-seat="' + seatId + '" data-premium="' + isPremium + '" title="' + title + '">' + seatId + '</div>');
            $row.append($seat);

            // Aisle gap after column C
            if (i === 2) {
                $row.append('<div class="aisle-gap"></div>');
            }
        });

        $seatMap.append($row);
    }

    $seatMap.on("click", ".seat", function () {
        var $seat = $(this);
        if ($seat.hasClass("occupied")) return;

        if ($seat.hasClass("selected")) {
            $seat.removeClass("selected");
            state.seat = null;
            state.seatPrice = 0;
        } else {
            $seatMap.find(".seat.selected").removeClass("selected");
            $seat.addClass("selected");
            state.seat = $seat.data("seat");
            state.seatPrice = $seat.data("premium") ? 30 : 0;
        }

        $("#selectedSeatLabel").text(state.seat ? state.seat : "None selected");
        $("#summarySeat").text(state.seat ? state.seat : "Not selected");
        updateSummary();
    });

    // ---------- Extra services ----------
    $("#baggageDecrease").on("click", function () {
        if (state.baggage > 0) {
            state.baggage--;
            $("#baggageQty").text(state.baggage);
            updateSummary();
        }
    });
    $("#baggageIncrease").on("click", function () {
        if (state.baggage < 5) {
            state.baggage++;
            $("#baggageQty").text(state.baggage);
            updateSummary();
        }
    });

    $("#priorityBoarding").on("change", function () {
        state.priorityBoarding = this.checked;
        updateSummary();
    });
    $("#travelInsurance").on("change", function () {
        state.travelInsurance = this.checked;
        updateSummary();
    });
    $("#loungeAccess").on("change", function () {
        state.loungeAccess = this.checked;
        updateSummary();
    });

    // ---------- Summary breakdown toggle ----------
    $("#breakdownToggle").on("click", function () {
        $("#summaryBreakdown").toggleClass("open");
        var open = $("#summaryBreakdown").hasClass("open");
        $(this).find("i").attr("class", open ? "bi bi-chevron-up" : "bi bi-chevron-down");
    });

    // ---------- Price calculation ----------
    function updateSummary() {
        var extrasTotal = (state.baggage * BAGGAGE_PRICE) +
            (state.priorityBoarding ? PRIORITY_PRICE : 0) +
            (state.travelInsurance ? INSURANCE_PRICE : 0) +
            (state.loungeAccess ? LOUNGE_PRICE : 0);

        var subtotal = basePrice + state.seatPrice + state.mealPrice + extrasTotal;
        var taxes = subtotal * TAX_RATE;
        var grandTotal = subtotal + taxes;

        $("#priceFlight").text("$" + basePrice.toFixed(2));
        $("#priceSeat").text(state.seatPrice > 0 ? "+$" + state.seatPrice.toFixed(2) : "$0.00");
        $("#priceMeal").text(state.mealPrice > 0 ? "+$" + state.mealPrice.toFixed(2) : "$0.00");
        $("#priceExtras").text(extrasTotal > 0 ? "+$" + extrasTotal.toFixed(2) : "$0.00");
        $("#priceTaxes").text("$" + taxes.toFixed(2));
        $("#priceTotal").text("$" + grandTotal.toFixed(2));

        $("#summaryMeal").text(meals.find(function (m) { return m.id === state.meal; }).name);
        $("#summaryExtras").text(
            (state.baggage > 0 ? state.baggage + " extra bag(s) " : "") +
            (state.priorityBoarding ? "Priority " : "") +
            (state.travelInsurance ? "Insurance " : "") +
            (state.loungeAccess ? "Lounge " : "") || "None"
        );
        if (!state.baggage && !state.priorityBoarding && !state.travelInsurance && !state.loungeAccess) {
            $("#summaryExtras").text("None");
        }
    }

    // ---------- Stepper highlighting ----------
    var $sections = $(".booking-section");
    var $steps = $(".booking-stepper .step");

    function refreshStepper() {
        $sections.each(function (i) {
            var $step = $steps.eq(i);
            if (this.hasAttribute("data-complete")) {
                $step.addClass("complete").removeClass("active");
            }
            if (this.open) {
                $step.addClass("active");
            } else {
                $step.removeClass("active");
            }
        });
    }

    $sections.on("toggle", refreshStepper);
    refreshStepper();

    // ---------- Inline validation ----------
    var $form = $("#bookingForm");

    var validators = {
        last_name: function (v) { return v.trim().length > 0; },
        first_name: function (v) { return v.trim().length > 0; },
        email_address: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
        contact_number: function (v) { return /^[0-9+()\-\s]{7,}$/.test(v); },
        passport_number: function (v) { return v.trim().length >= 6; },
        date_of_birth: function (v) { return v.trim().length > 0; },
        emergency_contact: function (v) { return /^[0-9+()\-\s]{7,}$/.test(v); }
    };

    function validateField($field) {
        var name = $field.attr("name");
        var validator = validators[name];
        if (!validator) return true;

        var $wrapper = $field.closest(".booking-field");
        var valid = validator($field.val());
        $wrapper.toggleClass("invalid", !valid);
        return valid;
    }

    Object.keys(validators).forEach(function (name) {
        $form.on("blur", '[name="' + name + '"]', function () {
            validateField($(this));
        });
    });

    $("#genderError").hide();

    $form.on("submit", function (e) {
        e.preventDefault();
        var allValid = true;

        Object.keys(validators).forEach(function (name) {
            var $field = $form.find('[name="' + name + '"]');
            if (!validateField($field)) allValid = false;
        });

        var genderChecked = $form.find('input[name="gender"]:checked').length > 0;
        $("#genderError").toggle(!genderChecked);
        if (!genderChecked) allValid = false;

        if (!state.seat) {
            $("#seatError").show();
            allValid = false;
        } else {
            $("#seatError").hide();
        }

        if (!allValid) {
            // Open the first section containing an error
            if ($(".booking-field.invalid, #seatError:visible").length) {
                $(".booking-field.invalid, #seatError:visible").first().closest("details.booking-section").prop("open", true);
                $(".booking-field.invalid, #seatError:visible").first()[0].scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        // Mark all sections complete and proceed
        $sections.attr("data-complete", "true").prop("open", false);
        refreshStepper();
        $steps.last().addClass("active");
        window.location.href = "reservations.html";
    });
});
