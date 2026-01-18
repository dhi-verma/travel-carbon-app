/**
 * script.js
 * DfT Travel Carbon Calculator
 *
 * This file controls the UI behaviour:
 * - Reads form inputs
 * - Shows/hides land/air options
 * - Calls CarbonCalc (src/calc.js) to calculate emissions
 * - Renders results + comparison table
 *
 * note: src/calc.js MUST be loaded before this file, because it defines window.CarbonCalc.
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

  // Main inputs
  const modeEl = $('mode'); // "land" or "air"
  const distanceEl = $('distance');
  const unitEl = $('unit'); // "km" or "miles"
  const passengersEl = $('passengers');

  // Land controls
  const landTypeEl = $('landType'); // "car" / "bus" / "rail" / "taxi"
  const carTypeEl = $('carType'); // "petrol" / "diesel" / "ev"
  const busTypeEl = $('busType'); // "local" / "coach"
  const railTypeEl = $('railType'); // "national" / "metro"
  const taxiTypeEl = $('taxiType'); // "regular"

  const landOptionsWrap = $('landOptionsWrap');
  const carTypeWrap = $('carTypeWrap');
  const busTypeWrap = $('busTypeWrap');
  const railTypeWrap = $('railTypeWrap');
  const taxiTypeWrap = $('taxiTypeWrap');

  // Air controls
  const airHaulEl = $('airHaul'); // "short" / "medium" / "long"
  const airClassEl = $('airClass'); // "economy" / "premium" / "business" / "first"
  const airOptionsWrap = $('airOptionsWrap');

  // Buttons
  const addCompareBtn = $('addCompareBtn');
  const clearBtn = $('clearBtn');
  const clearCompareBtn = $('clearCompareBtn');

  // Results outputs
  const resultsSection = $('resultsSection');
  const resultsTitleEl = $('resultsTitle');
  const outDistanceEl = $('outDistance');
  const outPerPersonEl = $('outPerPerson');
  const outTotalEl = $('outTotal');
  const outBasisEl = $('outBasis');
  const outFactorEl = $('outFactor');
  const warningEl = $('warning');
  const errorEl = $('error');

  // Comparison outputs
  const compareTableBody = $('compareTableBody');

  // ---------- UI state ----------
  const comparisonItems = [];

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

  function currentLandOption() {
    const landType = landTypeEl ? landTypeEl.value : 'car';

    if (landType === 'car') return { landType, option: carTypeEl ? carTypeEl.value : 'petrol' };
    if (landType === 'bus') return { landType, option: busTypeEl ? busTypeEl.value : 'local' };
    if (landType === 'rail') return { landType, option: railTypeEl ? railTypeEl.value : 'national' };
    if (landType === 'taxi') return { landType, option: taxiTypeEl ? taxiTypeEl.value : 'regular' };

    return { landType: 'car', option: 'petrol' };
  }

  function setLandSelectorVisibility() {
    const landType = landTypeEl ? landTypeEl.value : 'car';

    show(carTypeWrap, landType === 'car');
    show(busTypeWrap, landType === 'bus');
    show(railTypeWrap, landType === 'rail');
    show(taxiTypeWrap, landType === 'taxi');
  }

  function setModeVisibility() {
    const mode = modeEl ? modeEl.value : 'land';

    show(landOptionsWrap, mode === 'land');
    show(airOptionsWrap, mode === 'air');
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

  function renderAirResult(r) {
    if (resultsTitleEl) resultsTitleEl.textContent = r.label;

    if (outDistanceEl) outDistanceEl.textContent = `${formatDistance(r.distanceKm)} km`;

    // Show WITH RF as primary
    if (outPerPersonEl) outPerPersonEl.textContent = `${format2(r.perPersonWithRF)} kg CO₂e (with RF)`;
    if (outTotalEl) outTotalEl.textContent = `${format2(r.totalWithRF)} kg CO₂e (with RF)`;

    if (outBasisEl) {
      outBasisEl.textContent =
        'Basis: passenger-km (flight factors are per passenger, so totals scale with passenger count)';
    }

    if (outFactorEl) {
      outFactorEl.textContent =
        `Also available (no RF): ${format2(r.totalWithoutRF)} kg CO₂e total / ` +
        `${format2(r.perPersonWithoutRF)} kg CO₂e per passenger`;
    }
  }

  function renderResult(result) {
    show(resultsSection, true);

    if (result.type === 'land') {
      renderLandResult(result.data);
    } else {
      renderAirResult(result.data);
    }

    if (result.data.warning) showWarning(result.data.warning);
  }

  // ---------- Calculation ----------
  function readCommonInputs() {
    const distance = toNumber(distanceEl ? distanceEl.value : NaN);
    const unit = unitEl ? unitEl.value : 'km';
    const passengers = clampInt(passengersEl ? passengersEl.value : 1, 1);

    return { distance, unit, passengers };
  }

  function calculateCurrentTrip() {
    clearMessages();

    if (!window.CarbonCalc) {
      showError('Calculator engine did not load. Check that src/calc.js is loaded before script.js.');
      return null;
    }

    const mode = modeEl ? modeEl.value : 'land';
    const { distance, unit, passengers } = readCommonInputs();

    if (!Number.isFinite(distance) || distance <= 0) {
      showError('Please enter a valid distance (greater than 0).');
      return null;
    }

    if (mode === 'land') {
      const { landType, option } = currentLandOption();
      const r = CarbonCalc.calculateLandEmissions(distance, unit, landType, option, passengers);

      if (!r.success) {
        showError(r.error || 'Something went wrong calculating land emissions.');
        return null;
      }

      return { type: 'land', data: r, meta: { mode, landType, option, distance, unit, passengers } };
    }

    // Air
    const haul = airHaulEl ? airHaulEl.value : 'short';
    const flightClass = airClassEl ? airClassEl.value : 'economy';
    const r = CarbonCalc.calculateAirEmissions(distance, unit, haul, flightClass, passengers);

    if (!r.success) {
      showError(r.error || 'Something went wrong calculating air emissions.');
      return null;
    }

    return { type: 'air', data: r, meta: { mode, haul, flightClass, distance, unit, passengers } };
  }

  // ---------- Comparison ----------
  function makeTripLabel(result) {
    const m = result.meta;

    if (result.type === 'land') {
      return `Land • ${result.data.label} • ${formatDistance(result.data.distanceKm)} km • ${m.passengers} passenger(s)`;
    }

    const cls = (m.flightClass === 'premium') ? 'premium economy' : m.flightClass;
    return `Air • ${m.haul} • ${cls} • ${formatDistance(result.data.distanceKm)} km • ${m.passengers} passenger(s)`;
  }

  function getComparisonValue(result) {
    if (result.type === 'land') return result.data.total;
    return result.data.totalWithRF; // compare flights using WITH RF
  }

  function renderComparison() {
    if (!compareTableBody) return;

    compareTableBody.innerHTML = '';

    comparisonItems.forEach((item, idx) => {
      const tr = document.createElement('tr');

      const tdNum = document.createElement('td');
      tdNum.textContent = String(idx + 1);

      const tdTrip = document.createElement('td');
      tdTrip.textContent = item.label;

      const tdEm = document.createElement('td');
      tdEm.textContent = `${format2(item.value)} kg CO₂e`;

      const tdActions = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-small';
      btn.textContent = 'Remove';
      btn.addEventListener('click', () => {
        comparisonItems.splice(idx, 1);
        renderComparison();
      });
      tdActions.appendChild(btn);

      tr.appendChild(tdNum);
      tr.appendChild(tdTrip);
      tr.appendChild(tdEm);
      tr.appendChild(tdActions);

      compareTableBody.appendChild(tr);
    });
  }

  // ---------- Event listeners ----------

  if (modeEl) {
    modeEl.addEventListener('change', () => {
      clearMessages();
      setModeVisibility();
    });
  }

  if (landTypeEl) {
    landTypeEl.addEventListener('change', () => {
      clearMessages();
      setLandSelectorVisibility();
    });
  }

  // Calculate on submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const result = calculateCurrentTrip();
      if (!result) return;
      renderResult(result);
    });
  }

  // Add to comparison
  if (addCompareBtn) {
    addCompareBtn.addEventListener('click', () => {
      const result = calculateCurrentTrip();
      if (!result) return;

      renderResult(result);

      comparisonItems.push({
        label: makeTripLabel(result),
        value: getComparisonValue(result)
      });

      renderComparison();
    });
  }

  // Clear form + results
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearMessages();

      if (distanceEl) distanceEl.value = '10';
      if (unitEl) unitEl.value = 'km';
      if (passengersEl) passengersEl.value = '1';

      if (modeEl) modeEl.value = 'land';

      if (landTypeEl) landTypeEl.value = 'car';
      if (carTypeEl) carTypeEl.value = 'petrol';
      if (busTypeEl) busTypeEl.value = 'local';
      if (railTypeEl) railTypeEl.value = 'national';
      if (taxiTypeEl) taxiTypeEl.value = 'regular';

      if (airHaulEl) airHaulEl.value = 'short';
      if (airClassEl) airClassEl.value = 'economy';

      show(resultsSection, false);
      setModeVisibility();
      setLandSelectorVisibility();
    });
  }

  // Clear comparison
  if (clearCompareBtn) {
    clearCompareBtn.addEventListener('click', () => {
      comparisonItems.length = 0;
      renderComparison();
    });
  }

  // ---------- Init ----------
  setModeVisibility();
  setLandSelectorVisibility();
  show(resultsSection, false);
  clearMessages();
})();
