/**
 * Booking page client-side logic:
 * - AJAX seat map with premium seats (rows 1-2) and seat detail modal
 * - Meal selection (built from mealPackages array)
 * - Extra services (baggage, priority boarding, insurance, lounge)
 * - Real-time price calculation in the booking summary sidebar
 * - 3-step progress stepper
 * - Full client-side form validation
 */
document.addEventListener('DOMContentLoaded', function () {
  var seatMap = document.getElementById('seatMap');
  var seatInput = document.getElementById('seatNumberInput');
  var seatLabel = document.getElementById('selectedSeatLabel');
  var summarySeat = document.getElementById('summarySeat');
  var seatError = document.getElementById('seatError');
  var form = document.getElementById('bookingForm');

  // ─── Seat configuration ────────────────────────────
  var COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var totalRows = Math.ceil((typeof TOTAL_SEATS !== 'undefined' ? TOTAL_SEATS : 30) / COLS.length);
  var selectedSeat = seatInput ? seatInput.value : '';

  // ─── Pricing constants ─────────────────────────────
  var basePrice = (typeof BASE_PRICE !== 'undefined') ? BASE_PRICE : 0;
  var PREMIUM_SEAT_PRICE = 30;
  var BAGGAGE_PRICE = 25;
  var PRIORITY_PRICE = 15;
  var INSURANCE_PRICE = 20;
  var LOUNGE_PRICE = 35;
  var TAX_RATE = 0.12;

  // ─── Booking state ─────────────────────────────────
  var state = {
    seat: selectedSeat || null,
    seatPrice: 0,
    meal: 'M01',
    mealName: 'Standard Meal',
    mealPrice: 0,
    baggage: 0,
    priorityBoarding: false,
    travelInsurance: false,
    loungeAccess: false
  };

  // ─── Meal packages ─────────────────────────────────
  var mealPackages = [
    { id: 'M01', name: 'Standard Meal', description: "Chef's selection hot meal with beverage", price: 0.00 },
    { id: 'M02', name: 'Vegetarian', description: 'Plant-based meal excluding meat and seafood', price: 5.00 },
    { id: 'M03', name: 'Vegan', description: 'Strictly egg-free, dairy-free plant meal', price: 6.50 },
    { id: 'M04', name: 'Halal', description: 'Certified Halal prepared ingredients', price: 8.00 },
    { id: 'M05', name: 'Kosher', description: 'Certified Kosher prepared ingredients', price: 9.50 },
    { id: 'M06', name: 'Gluten-Free', description: 'Meals designed without gluten-containing elements', price: 7.00 }
  ];

  // Build meal options UI
  var mealContainer = document.getElementById('mealOptions');
  if (mealContainer) {
    mealPackages.forEach(function (meal) {
      var div = document.createElement('div');
      div.className = 'meal-option';
      div.setAttribute('data-id', meal.id);
      div.setAttribute('data-price', meal.price);
      div.setAttribute('tabindex', '0');
      div.setAttribute('role', 'button');
      div.setAttribute('aria-pressed', 'false');
      div.innerHTML =
        '<span class="meal-name">' + meal.name + '</span>' +
        '<span class="meal-desc">' + meal.description + '</span>' +
        '<span class="meal-price">' + (meal.price > 0 ? '+$' + meal.price.toFixed(2) : 'Included') + '</span>';
      mealContainer.appendChild(div);
    });

    // Meal selection handler
    mealContainer.addEventListener('click', function (e) {
      var option = e.target.closest('.meal-option');
      if (!option) return;
      selectMeal(option);
    });
    mealContainer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var option = e.target.closest('.meal-option');
        if (option) {
          e.preventDefault();
          selectMeal(option);
        }
      }
    });

    // Default to Standard Meal
    var defaultMeal = mealContainer.querySelector('.meal-option[data-id="M01"]');
    if (defaultMeal) selectMeal(defaultMeal);
  }

  function selectMeal(el) {
    var allMeals = mealContainer.querySelectorAll('.meal-option');
    allMeals.forEach(function (m) {
      m.classList.remove('selected');
      m.setAttribute('aria-pressed', 'false');
    });
    el.classList.add('selected');
    el.setAttribute('aria-pressed', 'true');
    state.meal = el.getAttribute('data-id');
    state.mealPrice = parseFloat(el.getAttribute('data-price')) || 0;
    // Find meal name
    var found = mealPackages.find(function (m) { return m.id === state.meal; });
    state.mealName = found ? found.name : 'Standard Meal';
    updateSummary();
  }

  // ─── Fetch taken seats via AJAX and build seat map ─
  function loadSeatMap() {
    if (typeof FLIGHT_ID === 'undefined' || !FLIGHT_ID) {
      seatMap.innerHTML = '<p class="text-danger">Flight ID not available.</p>';
      return;
    }

    fetch('/api/flights/' + FLIGHT_ID + '/seats')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) {
          seatMap.innerHTML = '<p class="text-danger">Could not load seat data.</p>';
          return;
        }

        var takenSet = {};
        (data.takenSeats || []).forEach(function (s) {
          takenSet[s] = true;
        });

        buildSeatGrid(takenSet);
      })
      .catch(function (err) {
        console.error('Seat map error:', err);
        seatMap.innerHTML = '<p class="text-danger">Error loading seat map.</p>';
      });
  }

  // ─── Build the seat grid HTML ──────────────────────
  function buildSeatGrid(takenSet) {
    var html = '<div class="seat-grid">';

    // Column headers
    html += '<div class="seat-row seat-header-row">';
    html += '<span class="seat-row-label"></span>';
    COLS.forEach(function (col, i) {
      html += '<span class="seat-col-header">' + col + '</span>';
      if (i === 2) html += '<span class="seat-aisle-gap"></span>';
    });
    html += '</div>';

    for (var row = 1; row <= totalRows; row++) {
      html += '<div class="seat-row">';
      html += '<span class="seat-row-label">' + row + '</span>';

      COLS.forEach(function (col, i) {
        var seatId = row + col;
        var isTaken = takenSet[seatId] === true;
        var isPremium = row <= 2;
        var isSelected = seatId === selectedSeat;

        var cls = 'seat';
        if (isTaken) {
          cls += ' seat-occupied';
        } else if (isSelected) {
          cls += ' seat-selected';
        } else if (isPremium) {
          cls += ' seat-premium';
        } else {
          cls += ' seat-available';
        }

        var seatType = isTaken ? 'Occupied' : (isPremium ? 'Premium' : 'Standard');
        var seatPriceStr = isTaken ? 'N/A' : (isPremium ? '+$30.00' : 'Included');

        html += '<button type="button" class="' + cls + '"' +
          ' data-seat="' + seatId + '"' +
          ' data-premium="' + isPremium + '"' +
          ' data-seat-type="' + seatType + '"' +
          ' data-seat-price="' + seatPriceStr + '"' +
          ' data-seat-row="' + row + '"' +
          ' data-seat-col="' + col + '"' +
          (isTaken ? ' disabled title="Occupied"' : ' title="Seat ' + seatId + ' • ' + seatType + (isPremium && !isTaken ? ' (+$30)' : '') + '"') +
          '>' + seatId + '</button>';

        // Aisle gap between columns C and D
        if (i === 2) {
          html += '<span class="seat-aisle-gap"></span>';
        }
      });

      html += '</div>';
    }

    html += '</div>';
    seatMap.innerHTML = html;

    // ─── Attach click handlers for seat detail modal ──
    seatMap.querySelectorAll('.seat').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openSeatModal(btn);
      });
    });

    // If a seat was pre-selected (from form re-render), restore state
    if (selectedSeat) {
      var preselected = seatMap.querySelector('.seat[data-seat="' + selectedSeat + '"]');
      if (preselected && !preselected.classList.contains('seat-occupied')) {
        state.seat = selectedSeat;
        state.seatPrice = preselected.getAttribute('data-premium') === 'true' ? PREMIUM_SEAT_PRICE : 0;
        updateSummary();
      }
    }
  }

  // ─── Seat detail modal ─────────────────────────────
  var modalSeatId = null;

  function openSeatModal(btn) {
    var seatId = btn.getAttribute('data-seat');
    var isOccupied = btn.classList.contains('seat-occupied');
    var isPremium = btn.getAttribute('data-premium') === 'true';
    var seatType = btn.getAttribute('data-seat-type');
    var seatRow = btn.getAttribute('data-seat-row');
    var seatCol = btn.getAttribute('data-seat-col');
    var isSelected = btn.classList.contains('seat-selected');

    document.getElementById('modalSeatNumber').textContent = seatId;
    document.getElementById('modalSeatRow').textContent = 'Row ' + seatRow;
    document.getElementById('modalSeatCol').textContent = 'Column ' + seatCol;
    document.getElementById('modalSeatType').textContent = seatType;
    document.getElementById('modalSeatPrice').textContent =
      isOccupied ? 'N/A' : (isPremium ? '+$30.00' : 'Included in fare');

    var statusEl = document.getElementById('modalSeatStatus');
    var selectBtn = document.getElementById('modalSelectSeatBtn');

    if (isOccupied) {
      statusEl.innerHTML = '<span class="badge badge-danger">Occupied</span>';
      selectBtn.disabled = true;
      selectBtn.textContent = 'Unavailable';
    } else if (isSelected) {
      statusEl.innerHTML = '<span class="badge badge-success">Currently Selected</span>';
      selectBtn.disabled = false;
      selectBtn.textContent = 'Deselect Seat';
    } else {
      statusEl.innerHTML = '<span class="badge badge-success">Available</span>';
      selectBtn.disabled = false;
      selectBtn.textContent = 'Select This Seat';
    }

    modalSeatId = seatId;

    // Show modal (jQuery/Bootstrap)
    if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
      $('#seatDetailModal').modal('show');
    }
  }

  // Handle seat select/deselect from the modal
  var modalSelectBtn = document.getElementById('modalSelectSeatBtn');
  if (modalSelectBtn) {
    modalSelectBtn.addEventListener('click', function () {
      if (!modalSeatId) return;

      var seatBtn = seatMap.querySelector('.seat[data-seat="' + modalSeatId + '"]');
      if (!seatBtn || seatBtn.classList.contains('seat-occupied')) return;

      if (seatBtn.classList.contains('seat-selected')) {
        // Deselect
        seatBtn.classList.remove('seat-selected');
        var isPrem = seatBtn.getAttribute('data-premium') === 'true';
        seatBtn.classList.add(isPrem ? 'seat-premium' : 'seat-available');
        state.seat = null;
        state.seatPrice = 0;
      } else {
        // Deselect previous
        var prev = seatMap.querySelector('.seat-selected');
        if (prev) {
          prev.classList.remove('seat-selected');
          var wasPrem = prev.getAttribute('data-premium') === 'true';
          prev.classList.add(wasPrem ? 'seat-premium' : 'seat-available');
        }
        // Select new
        seatBtn.classList.remove('seat-available', 'seat-premium');
        seatBtn.classList.add('seat-selected');
        state.seat = modalSeatId;
        state.seatPrice = seatBtn.getAttribute('data-premium') === 'true' ? PREMIUM_SEAT_PRICE : 0;
        seatError.style.display = 'none';
      }

      seatInput.value = state.seat || '';
      seatLabel.textContent = state.seat || 'None selected';
      if (summarySeat) summarySeat.textContent = state.seat || 'Not selected';
      updateSummary();

      // Close modal
      if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
        $('#seatDetailModal').modal('hide');
      }
    });
  }

  // ─── Extra service controls ────────────────────────
  var bagDecBtn = document.getElementById('baggageDecrease');
  var bagIncBtn = document.getElementById('baggageIncrease');
  var bagQtyEl = document.getElementById('baggageQty');

  if (bagDecBtn) {
    bagDecBtn.addEventListener('click', function () {
      if (state.baggage > 0) {
        state.baggage--;
        bagQtyEl.textContent = state.baggage;
        updateSummary();
      }
    });
  }
  if (bagIncBtn) {
    bagIncBtn.addEventListener('click', function () {
      if (state.baggage < 5) {
        state.baggage++;
        bagQtyEl.textContent = state.baggage;
        updateSummary();
      }
    });
  }

  var priorityEl = document.getElementById('priorityBoarding');
  var insuranceEl = document.getElementById('travelInsurance');
  var loungeEl = document.getElementById('loungeAccess');

  if (priorityEl) priorityEl.addEventListener('change', function () {
    state.priorityBoarding = this.checked;
    updateSummary();
  });
  if (insuranceEl) insuranceEl.addEventListener('change', function () {
    state.travelInsurance = this.checked;
    updateSummary();
  });
  if (loungeEl) loungeEl.addEventListener('change', function () {
    state.loungeAccess = this.checked;
    updateSummary();
  });

  // ─── Price breakdown toggle ────────────────────────
  var breakdownToggle = document.getElementById('breakdownToggle');
  var breakdownPanel = document.getElementById('summaryBreakdown');
  if (breakdownToggle && breakdownPanel) {
    breakdownToggle.addEventListener('click', function () {
      breakdownPanel.classList.toggle('open');
      var isOpen = breakdownPanel.classList.contains('open');
      breakdownToggle.querySelector('i').className = isOpen ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
    });
  }

  // ─── Update summary sidebar ────────────────────────
  function updateSummary() {
    var extrasTotal = (state.baggage * BAGGAGE_PRICE) +
      (state.priorityBoarding ? PRIORITY_PRICE : 0) +
      (state.travelInsurance ? INSURANCE_PRICE : 0) +
      (state.loungeAccess ? LOUNGE_PRICE : 0);

    var subtotal = basePrice + state.seatPrice + state.mealPrice + extrasTotal;
    var taxes = subtotal * TAX_RATE;
    var grandTotal = subtotal + taxes;

    // Breakdown
    var priceFlight = document.getElementById('priceFlight');
    var priceSeat = document.getElementById('priceSeat');
    var priceMealEl = document.getElementById('priceMeal');
    var priceExtras = document.getElementById('priceExtras');
    var priceTaxes = document.getElementById('priceTaxes');
    var priceTotal = document.getElementById('priceTotal');

    if (priceFlight) priceFlight.textContent = '$' + basePrice.toFixed(2);
    if (priceSeat) priceSeat.textContent = state.seatPrice > 0 ? '+$' + state.seatPrice.toFixed(2) : '$0.00';
    if (priceMealEl) priceMealEl.textContent = state.mealPrice > 0 ? '+$' + state.mealPrice.toFixed(2) : '$0.00';
    if (priceExtras) priceExtras.textContent = extrasTotal > 0 ? '+$' + extrasTotal.toFixed(2) : '$0.00';
    if (priceTaxes) priceTaxes.textContent = '$' + taxes.toFixed(2);
    if (priceTotal) priceTotal.textContent = '$' + grandTotal.toFixed(2);

    // Summary labels
    var summaryMeal = document.getElementById('summaryMeal');
    if (summaryMeal) summaryMeal.textContent = state.mealName;

    var summaryExtras = document.getElementById('summaryExtras');
    if (summaryExtras) {
      var parts = [];
      if (state.baggage > 0) parts.push(state.baggage + ' extra bag' + (state.baggage > 1 ? 's' : ''));
      if (state.priorityBoarding) parts.push('Priority');
      if (state.travelInsurance) parts.push('Insurance');
      if (state.loungeAccess) parts.push('Lounge');
      summaryExtras.textContent = parts.length > 0 ? parts.join(', ') : 'None';
    }

    // Update hidden fields for form submission
    var mealInput = document.getElementById('mealPackageInput');
    var extrasInput = document.getElementById('extraServicesInput');
    var totalInput = document.getElementById('totalPriceInput');
    if (mealInput) mealInput.value = state.mealName;
    if (extrasInput) {
      var extrasList = [];
      if (state.baggage > 0) extrasList.push('Baggage x' + state.baggage);
      if (state.priorityBoarding) extrasList.push('Priority Boarding');
      if (state.travelInsurance) extrasList.push('Travel Insurance');
      if (state.loungeAccess) extrasList.push('Lounge Access');
      extrasInput.value = extrasList.join(', ');
    }
    if (totalInput) totalInput.value = grandTotal.toFixed(2);
  }

  // ─── Stepper progress tracking ─────────────────────
  var sections = document.querySelectorAll('.booking-section');
  var steps = document.querySelectorAll('.booking-stepper .step');

  function refreshStepper() {
    sections.forEach(function (section, i) {
      var step = steps[i];
      if (!step) return;
      if (section.hasAttribute('data-complete')) {
        step.classList.add('complete');
        step.classList.remove('active');
      }
      if (section.open) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  // Block opening Step 3 until a seat is selected
  sections.forEach(function (section, idx) {
    section.addEventListener('toggle', function () {
      if (idx === 2 && section.open && !state.seat) {
        section.open = false;
        seatError.style.display = 'block';
        sections[1].open = true;
        seatError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      refreshStepper();
    });
  });
  refreshStepper();

  // ─── Client-side form validation ───────────────────
  if (form) {
    form.addEventListener('submit', function (e) {
      var valid = true;

      // Full name
      var fullName = document.getElementById('fullName');
      var fullNameErr = document.getElementById('fullNameError');
      if (!fullName.value.trim()) {
        fullNameErr.style.display = 'block';
        valid = false;
      } else {
        fullNameErr.style.display = 'none';
      }

      // Email
      var email = document.getElementById('email');
      var emailErr = document.getElementById('emailError');
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        emailErr.style.display = 'block';
        valid = false;
      } else {
        emailErr.style.display = 'none';
      }

      // Contact Number
      var contact = document.getElementById('contactNumber');
      var contactErr = document.getElementById('contactError');
      if (!contact.value.trim() || !/^[0-9+()\-\s]{7,}$/.test(contact.value.trim())) {
        contactErr.style.display = 'block';
        valid = false;
      } else {
        contactErr.style.display = 'none';
      }

      // Passport
      var passport = document.getElementById('passportNumber');
      var passportErr = document.getElementById('passportError');
      if (!passport.value.trim() || passport.value.trim().length < 6) {
        passportErr.style.display = 'block';
        valid = false;
      } else {
        passportErr.style.display = 'none';
      }

      // Date of Birth
      var dob = document.getElementById('dateOfBirth');
      var dobErr = document.getElementById('dobError');
      if (!dob.value.trim()) {
        dobErr.style.display = 'block';
        valid = false;
      } else {
        dobErr.style.display = 'none';
      }

      // Gender
      var genderChecked = document.querySelector('input[name="gender"]:checked');
      var genderErr = document.getElementById('genderError');
      if (!genderChecked) {
        genderErr.style.display = 'block';
        valid = false;
      } else {
        genderErr.style.display = 'none';
      }

      // Emergency Contact
      var emergency = document.getElementById('emergencyContact');
      var emergencyErr = document.getElementById('emergencyError');
      if (!emergency.value.trim() || !/^[0-9+()\-\s]{7,}$/.test(emergency.value.trim())) {
        emergencyErr.style.display = 'block';
        valid = false;
      } else {
        emergencyErr.style.display = 'none';
      }

      // Seat
      if (!seatInput.value) {
        seatError.style.display = 'block';
        valid = false;
      } else {
        seatError.style.display = 'none';
      }

      if (!valid) {
        e.preventDefault();
        var firstErr = form.querySelector('.field-error[style*="display: block"], .field-error[style*="display:block"]');
        if (firstErr) {
          // Open parent details section
          var parentDetails = firstErr.closest('details.booking-section');
          if (parentDetails) parentDetails.open = true;
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }

  // ─── Initialize ────────────────────────────────────
  loadSeatMap();
  updateSummary();
});
