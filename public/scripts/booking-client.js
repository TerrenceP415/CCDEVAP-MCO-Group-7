/**
 * booking-client.js
 * Handles the dynamic seat map (AJAX) and client-side form validation
 * for the booking page.
 *
 * Expects two globals set by the booking.hbs template:
 *   - FLIGHT_ID  (string)  — the MongoDB _id of the flight
 *   - TOTAL_SEATS (number) — total seat count for the flight
 */
document.addEventListener('DOMContentLoaded', function () {
  var seatMap = document.getElementById('seatMap');
  var seatInput = document.getElementById('seatNumberInput');
  var seatLabel = document.getElementById('selectedSeatLabel');
  var summarySeat = document.getElementById('summarySeat');
  var seatError = document.getElementById('seatError');
  var form = document.getElementById('bookingForm');

  // ─── Seat configuration ────────────────────────────
  var COLS = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 seats per row
  var totalRows = Math.ceil((typeof TOTAL_SEATS !== 'undefined' ? TOTAL_SEATS : 30) / COLS.length);
  var selectedSeat = seatInput ? seatInput.value : '';

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
    html += '<span class="seat-row-label"></span>'; // empty cell for row numbers
    COLS.forEach(function (col) {
      html += '<span class="seat-col-header">' + col + '</span>';
    });
    html += '</div>';

    for (var row = 1; row <= totalRows; row++) {
      html += '<div class="seat-row">';
      html += '<span class="seat-row-label">' + row + '</span>';

      COLS.forEach(function (col) {
        var seatId = row + col;
        var isTaken = takenSet[seatId] === true;
        var isSelected = seatId === selectedSeat;

        var cls = 'seat';
        if (isTaken) {
          cls += ' seat-occupied';
        } else if (isSelected) {
          cls += ' seat-selected';
        } else {
          cls += ' seat-available';
        }

        html += '<button type="button" class="' + cls + '" data-seat="' + seatId + '"' +
          (isTaken ? ' disabled title="Occupied"' : ' title="Seat ' + seatId + '"') + '>' +
          seatId + '</button>';
      });

      html += '</div>';
    }

    html += '</div>';
    seatMap.innerHTML = html;

    // ─── Attach click handlers ─────────────────────
    seatMap.querySelectorAll('.seat-available, .seat-selected').forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Deselect previous
        var prev = seatMap.querySelector('.seat-selected');
        if (prev) {
          prev.classList.remove('seat-selected');
          prev.classList.add('seat-available');
        }

        // Select new
        btn.classList.remove('seat-available');
        btn.classList.add('seat-selected');

        selectedSeat = btn.getAttribute('data-seat');
        seatInput.value = selectedSeat;
        seatLabel.textContent = selectedSeat;
        if (summarySeat) summarySeat.textContent = selectedSeat;
        seatError.style.display = 'none';
      });
    });
  }

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

      // Passport
      var passport = document.getElementById('passportNumber');
      var passportErr = document.getElementById('passportError');
      if (!passport.value.trim() || passport.value.trim().length < 6) {
        passportErr.style.display = 'block';
        valid = false;
      } else {
        passportErr.style.display = 'none';
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
        // Scroll to the first visible error
        var firstErr = form.querySelector('.field-error[style*="display: block"], .field-error[style*="display:block"]');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ─── Initialize ────────────────────────────────────
  loadSeatMap();
});
