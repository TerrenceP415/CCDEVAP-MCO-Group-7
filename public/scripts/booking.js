$(function () {

    // Read selected flight ID from URL (?flight=FL-XXX)
    var urlParams = new URLSearchParams(window.location.search);
    var flightId = urlParams.get("flight");

    var flight = null;
    if (typeof sampleFlights !== "undefined" && flightId) {
        flight = sampleFlights.find(function (f) { return f.id === flightId; }) || null;
    }
    // Use first available flight if none matched, hardcoded fallback
    if (!flight) {
        flight = (typeof sampleFlights !== "undefined" && sampleFlights.length > 0)
            ? sampleFlights[0]
            : {
                airlineName: "SkyEase Airways",
                flightNumber: "SE-001",
                origin: "MNL",
                destination: "LAX",
                departureTime: "08:30 AM",
                arrivalTime: "07:15 PM",
                duration: "14h 45m",
                class: "Economy",
                price: 850.00
            };
    }

    // Populate the sidebar flight summary
    $("#summaryRoute").text(flight.origin + " \u2192 " + flight.destination);
    $("#summaryAirline").text(flight.airlineName + " \u00b7 " + flight.flightNumber);
    $("#summaryTime").text(flight.departureTime + " - " + flight.arrivalTime + " (" + flight.duration + ")");
    $("#summaryClass").text(flight.class);

    var basePrice = flight.price;

    // Passenger counts from URL query params (defaults: 1 adult, 0 children, 0 infants)
    var adults = parseInt(urlParams.get("adults")) || 1;
    var children = parseInt(urlParams.get("children")) || 0;
    var infants = parseInt(urlParams.get("infants")) || 0;
    var totalPassengers = adults + children + infants;

    // Tracks all user selections that affect the final price
    var state = {
        seat: null,
        seatPrice: 0,
        meal: "M01",
        mealPrice: 0,
        baggage: 0,
        priorityBoarding: false,
        travelInsurance: false,
        loungeAccess: false,
        passengerCount: totalPassengers
    };

    // Per-unit pricing for extras
    var BAGGAGE_PRICE = 25;
    var PRIORITY_PRICE = 15;
    var INSURANCE_PRICE = 20;
    var LOUNGE_PRICE = 35;
    var TAX_RATE = 0.12;

    // Build meal package options from data.js
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

    // Build the 6-row, 6-column (A-F) seat map
    var rows = 6;
    var cols = ["A", "B", "C", "D", "E", "F"];
    var occupied = ["1C", "1D", "2A", "3F", "4B", "4C", "5E", "6A"];
    var $seatMap = $("#seatMap");

    for (var r = 1; r <= rows; r++) {
        var $row = $('<div class="row no-gutters seat-row justify-content-center align-items-center mb-1"></div>');

        // Row number label
        $row.append('<div class="col-auto seat-row-label">' + r + '</div>');

        cols.forEach(function (col, i) {
            var seatId = r + col;
            var isPremium = r <= 2;
            var isOccupied = occupied.indexOf(seatId) !== -1;

            var classes = "seat";
            if (isOccupied) classes += " occupied";
            else if (isPremium) classes += " premium";

            var seatType = isOccupied ? "Occupied" : (isPremium ? "Premium" : "Standard");
            var seatPrice = isPremium ? "$30.00" : "Included";
            if (isOccupied) seatPrice = "N/A";

            var $seat = $(
                '<div class="col-auto px-1">' +
                    '<div class="' + classes + '"' +
                        ' data-seat="' + seatId + '"' +
                        ' data-premium="' + isPremium + '"' +
                        ' data-seat-type="' + seatType + '"' +
                        ' data-seat-price="' + seatPrice + '"' +
                        ' data-seat-row="' + r + '"' +
                        ' data-seat-col="' + col + '"' +
                        ' data-toggle="tooltip"' +
                        ' data-placement="top"' +
                        ' title="Seat ' + seatId + ' \u2022 ' + seatType + (isPremium && !isOccupied ? ' (+$30)' : '') + '"' +
                    '>' + seatId + '</div>' +
                '</div>'
            );
            $row.append($seat);

            // Aisle gap between columns C and D
            if (i === 2) {
                $row.append('<div class="col-auto aisle-gap"></div>');
            }
        });

        $seatMap.append($row);
    }

    // Initialize ALL Bootstrap tooltips (seats + extra services)
    $('[data-toggle="tooltip"]').tooltip();

    // Seat detail modal: shows seat info and select/deselect action
    var modalSeatId = null;

    $seatMap.on("click", ".seat", function () {
        var $seat = $(this);
        var seatId = $seat.data("seat");
        var isOccupied = $seat.hasClass("occupied");
        var isPremium = $seat.data("premium");
        var seatType = $seat.data("seat-type");
        var seatPrice = $seat.data("seat-price");
        var seatRow = $seat.data("seat-row");
        var seatCol = $seat.data("seat-col");

        // Populate modal fields
        $("#modalSeatNumber").text(seatId);
        $("#modalSeatRow").text("Row " + seatRow);
        $("#modalSeatCol").text("Column " + seatCol);
        $("#modalSeatType").text(seatType);
        $("#modalSeatPrice").text(isOccupied ? "N/A" : (isPremium ? "+$30.00" : "Included in fare"));

        if (isOccupied) {
            $("#modalSeatStatus").html('<span class="badge badge-danger">Occupied</span>');
            $("#modalSelectSeatBtn").prop("disabled", true).text("Unavailable");
        } else if ($seat.hasClass("selected")) {
            $("#modalSeatStatus").html('<span class="badge badge-success">Currently Selected</span>');
            $("#modalSelectSeatBtn").prop("disabled", false).text("Deselect Seat");
        } else {
            $("#modalSeatStatus").html('<span class="badge badge-success">Available</span>');
            $("#modalSelectSeatBtn").prop("disabled", false).text("Select This Seat");
        }

        modalSeatId = seatId;

        // Hide the tooltip before opening modal
        $seat.tooltip('hide');
        $("#seatDetailModal").modal("show");
    });

    // Handle seat select/deselect from the modal
    $("#modalSelectSeatBtn").on("click", function () {
        if (!modalSeatId) return;

        var $seat = $seatMap.find('.seat[data-seat="' + modalSeatId + '"]');
        if ($seat.hasClass("occupied")) return;

        if ($seat.hasClass("selected")) {
            // Deselect
            $seat.removeClass("selected");
            state.seat = null;
            state.seatPrice = 0;
        } else {
            // Select
            $seatMap.find(".seat.selected").removeClass("selected");
            $seat.addClass("selected");
            state.seat = $seat.data("seat");
            state.seatPrice = $seat.data("premium") ? 30 : 0;
            // Clear seat-required error as soon as user picks a seat
            $("#seatError").hide();
        }

        $("#selectedSeatLabel").text(state.seat ? state.seat : "None selected");
        $("#summarySeat").text(state.seat ? state.seat : "Not selected");
        updateSummary();

        // Close modal
        $("#seatDetailModal").modal("hide");
    });

    // Extra service controls (baggage quantity, toggles)
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

    // Toggle price breakdown panel in sidebar
    $("#breakdownToggle").on("click", function () {
        $("#summaryBreakdown").toggleClass("open");
        var open = $("#summaryBreakdown").hasClass("open");
        $(this).find("i").attr("class", open ? "bi bi-chevron-up" : "bi bi-chevron-down");
    });

    // Recalculates and updates all price fields in the sidebar
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

        // Passenger count
        $("#summaryPassengers").text(state.passengerCount);

        $("#summaryMeal").text(meals.find(function (m) { return m.id === state.meal; }).name);
        var extrasText =
            (state.baggage > 0 ? state.baggage + " extra bag(s) " : "") +
            (state.priorityBoarding ? "Priority " : "") +
            (state.travelInsurance ? "Insurance " : "") +
            (state.loungeAccess ? "Lounge " : "");
        $("#summaryExtras").text(extrasText.trim());
        if (!state.baggage && !state.priorityBoarding && !state.travelInsurance && !state.loungeAccess) {
            $("#summaryExtras").text("None");
        }
    }

    // Stepper indicator: highlights which booking section is active/complete
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

    // Block opening "Meal & Extras" section until a seat is selected
    $sections.on("toggle", function (e) {
        var $this = $(this);
        var sectionIndex = $sections.index($this);

        // If trying to open Section 3 (index 2) without a seat selected
        if (sectionIndex === 2 && $this.prop("open") && !state.seat) {
            $this.prop("open", false);
            $("#seatError").show();
            $sections.eq(1).prop("open", true);
            $("#seatError")[0].scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        refreshStepper();
    });
    refreshStepper();

    // Form validation rules per field
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

    // Validate on blur so users get immediate feedback
    Object.keys(validators).forEach(function (name) {
        $form.on("blur", '[name="' + name + '"]', function () {
            validateField($(this));
        });
    });

    $("#genderError").hide();

    // Final submit: validate everything, scroll to first error if any
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
            if ($(".booking-field.invalid, #seatError:visible").length) {
                $(".booking-field.invalid, #seatError:visible").first().closest("details.booking-section").prop("open", true);
                $(".booking-field.invalid, #seatError:visible").first()[0].scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        // All valid — mark sections complete and redirect to reservations
        $sections.attr("data-complete", "true").prop("open", false);
        refreshStepper();
        $steps.last().addClass("active");
        window.location.href = "reservations.html";
    });
});