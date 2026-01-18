/**
 * script.js
 * DfT Travel Carbon Calculator
 */

(function () {
  'use strict';

  // ---------- Helpers ----------

  function $(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function clampInt(value, min) {
    const n = Math.floor(toNumber(value));
    if (!Number.isFinite(n) || n < min) return min;
    return n;
  }

  // Always show 2dp (e.g. 1.70 not 1.7)
  function format2(num) {
    const n = toNumber(num);
    if (!Number.isFinite(n)) return '-';
    return n.toFixed(2);
  }

  function formatDistance(num) {
    const n = toNumber(num);
    if (!Number.isFinite(n)) return '-';
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2);
  }

  // ---------- Basic page checks ----------

  if (!window.CarbonCalc) {
    console.error('CarbonCalc is not defined. Ensure src/calc.js loads BEFORE script.js');
  } else {
    console.log('Carbon calculator loaded successfully');
  }

  // ---------- DOM elements ----------
  const form = $('calcForm');

  // Core inputs (Branch 6)
  const distanceEl = $('distance');
  const unitEl = $('unit'); // "km" or "miles"
  const passengersEl = $('passengers');
  const carTypeEl = $('carType'); // "petrol" / "diesel" (Branch 6 UI)

  // Buttons
  const clearBtn = $('clearBtn');

  // Messages
  const errorEl = $('error');
  const warningEl = $('warning'); // present in final HTML; harmless if unused

  // Results outputs (final Results IDs)
  const resultsSection = $('resultsSection');
  const resultsTitleEl = $('resultsTitle');
  const outDistanceEl = $('outDistance');
  const outPerPersonEl = $('outPerPerson');
  const outTotalEl = $('outTotal');
  const outBasisEl = $('outBasis');
  const outFactorEl = $('outFactor');

  // ---------- UI logic ----------

  function show(el, visible) {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
  }

  function clearMessages() {
    if (errorEl) {
      errorEl.textContent = '';
      show(errorEl, false);
    }
    if (warningEl) {
      warningEl.textContent = '';
      show(warningEl, false);
    }
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    show(errorEl, true);
  }

  function showWarning(msg) {
    if (!warningEl) return;
    warningEl.textContent = msg;
    show(warningEl, true);
  }

  // ---------- Rendering ----------
  function renderLandResult(r) {
    if (resultsTitleEl) resultsTitleEl.textContent = r.label;

    if (outDistanceEl) outDistanceEl.textContent = `${formatDistance(r.distanceKm)} km`;

    if (outPerPersonEl) outPerPersonEl.textContent = `${format2(r.perPerson)} kg CO₂e`;
    if (outTotalEl) outTotalEl.textContent = `${format2(r.total)} kg CO₂e`;

    // Clear “Basis: vehicle” confusion
    if (outBasisEl) {
      if (r.basis === 'vehicle') {
        outBasisEl.textContent =
          'Basis: vehicle-km (total is for the whole vehicle; per-person assumes emissions are shared equally across passengers)';
      } else {
        outBasisEl.textContent =
          'Basis: passenger-km (per-person is calculated first; group total scales with passenger count)';
      }
    }

    if (outFactorEl) {
      const unit = r.factorUnit === 'vehicle.km' ? 'vehicle-km' : 'passenger-km';
      outFactorEl.textContent = `Factor used: ${format2(r.factor)} kg CO₂e per ${unit}`;
    }
  }

  function renderResult(r) {
    show(resultsSection, true);
    renderLandResult(r);
    if (r && r.warning) showWarning(r.warning);
  }

  // ---------- Calculation ----------
  function readCommonInputs() {
    const distance = toNumber(distanceEl ? distanceEl.value : NaN);
    const unit = unitEl ? unitEl.value : 'km';
    const passengers = clampInt(passengersEl ? passengersEl.value : 1, 1);

    return { distance, unit, passengers };
  }

  function calculateCarTrip() {
    clearMessages();

    if (!window.CarbonCalc) {
      showError('Calculator engine did not load. Check that src/calc.js is loaded before script.js.');
      return null;
    }

    const { distance, unit, passengers } = readCommonInputs();

    if (!Number.isFinite(distance) || distance <= 0) {
      showError('Please enter a valid distance (greater than 0).');
      return null;
    }

    const carType = carTypeEl ? carTypeEl.value : 'petrol';
    const r = CarbonCalc.calculateLandEmissions(distance, unit, 'car', carType, passengers);

    if (!r.success) {
      showError(r.error || 'Something went wrong calculating car emissions.');
      return null;
    }

    return r;
  }

  // ---------- Event listeners ----------

  // Calculate on submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = calculateCarTrip();
      if (!r) return;
      renderResult(r);
    });
  }

  // Clear form + results (car-only)
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearMessages();

      if (distanceEl) distanceEl.value = '10';
      if (unitEl) unitEl.value = 'km';
      if (passengersEl) passengersEl.value = '1';

      if (carTypeEl) carTypeEl.value = 'petrol';

      show(resultsSection, false);
    });
  }

  // ---------- Init ----------
  show(resultsSection, false);
  clearMessages();
})();
