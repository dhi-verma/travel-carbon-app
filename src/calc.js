/**
 * src/calc.js
 * DfT Travel Carbon Calculator (Student Project)
 *
 * This file contains the emissions calculation logic and a small embedded subset
 * of the UK Government GHG Conversion Factors (2025) needed for this coursework MVP.
 *
 * Design choices (kept simple for a student project):
 * - No external dependencies, so it runs on GitHub Pages.
 * - Factors are embedded so the app works offline once loaded.
 * - Land travel: cars are "per vehicle-km", bus/rail/taxi are "per passenger-km".
 * - Air travel: factors are per passenger-km and provided with and without RF.
 */

/* ---------------------------
   Embedded Factors (2025 subset)
   --------------------------- */

const FACTORS_2025 = {
  meta: {
    dataset: "UK Government GHG Conversion Factors 2025 (condensed set)",
    published: "2025-06-10",
    units: "kgCO2e per unit",
    notes: [
      "Land: car factors are per vehicle-km; taxi/bus/rail are per passenger-km.",
      "Air: factors are per passenger-km and include values with and without Radiative Forcing (RF)."
    ]
  },

  land: {
    car: {
      petrol: { unit: "vehicle.km", kgco2e_per_unit: 0.16272 },
      diesel: { unit: "vehicle.km", kgco2e_per_unit: 0.17304 },
      hybrid: { unit: "vehicle.km", kgco2e_per_unit: 0.12825 },
      plug_in_hybrid: { unit: "vehicle.km", kgco2e_per_unit: 0.10461 },
      electric: { unit: "vehicle.km", kgco2e_per_unit: 0.04047 }
    }
  }
};

/* ---------------------------
   UI-friendly Factor Mapping
   (matches the values in your HTML selects)
   --------------------------- */

const EMISSION_FACTORS = {
  meta: FACTORS_2025.meta,

  land: {
    car: {
      petrol: { label: "Car (Petrol)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.petrol.kgco2e_per_unit },
      diesel: { label: "Car (Diesel)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.diesel.kgco2e_per_unit },
      // Optional extra fuels (keep for future UI options)
      hybrid: { label: "Car (Hybrid)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.hybrid.kgco2e_per_unit },
      plug_in_hybrid: { label: "Car (Plug-in Hybrid)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.plug_in_hybrid.kgco2e_per_unit },
      // Alias: UI might use "ev"
      electric: { label: "Car (Electric)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.electric.kgco2e_per_unit },
      ev: { label: "Car (Electric)", basis: "vehicle", unit: "vehicle.km", factor: FACTORS_2025.land.car.electric.kgco2e_per_unit }
    }
  }
};

/* ---------------------------
   Helpers
   --------------------------- */

function roundToTwo(num) {
  return Math.round(num * 100) / 100;
}

function milesToKm(miles) {
  return miles * 1.60934;
}

function normalizeDistance(distance, unit) {
  if (unit === "miles") return milesToKm(distance);
  return distance;
}

function normalizePassengers(passengers) {
  const p = Number(passengers);
  if (!Number.isFinite(p) || p < 1) return 1;
  return Math.floor(p);
}

/* ---------------------------
   Core Calculators
   --------------------------- */

/**
 * Land travel calculation.
 *
 * Returns:
 * - total: total emissions for the whole trip group (kgCO2e)
 * - perPerson: emissions per passenger (kgCO2e)
 * - basis: "vehicle" or "passenger" (important for interpretation)
 */
function calculateLandEmissions(distance, unit, landType, option, passengers) {
  const distanceKm = normalizeDistance(Number(distance), unit);
  const pax = normalizePassengers(passengers);

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return { success: false, error: "Please enter a valid distance." };
  }

  const typeMap = EMISSION_FACTORS.land[landType];
  if (!typeMap) {
    return { success: false, error: "Invalid travel mode selected." };
  }

  const factorData = typeMap[option];
  if (!factorData) {
    return { success: false, error: "Invalid option selected for this travel mode." };
  }

  const factor = factorData.factor;
  const basis = factorData.basis;

  let totalEmissions;
  let perPersonEmissions;

  if (basis === "vehicle") {
    // Vehicle-km: total is for the vehicle; share across passengers
    totalEmissions = factor * distanceKm;
    perPersonEmissions = totalEmissions / pax;
  } else {
    // Passenger-km: per-person is factor * distance; group total multiplies by passengers
    perPersonEmissions = factor * distanceKm;
    totalEmissions = perPersonEmissions * pax;
  }

  return {
    success: true,
    label: factorData.label,
    distanceKm: roundToTwo(distanceKm),
    passengers: pax,
    basis: basis,
    factor: factor,
    factorUnit: factorData.unit,
    perPerson: roundToTwo(perPersonEmissions),
    total: roundToTwo(totalEmissions)
  };
}

/* ---------------------------
   Public API (Browser + Tests)
   --------------------------- */

const CarbonCalc = {
  // Expose factors for transparency / debugging (useful for README screenshots)
  FACTORS_2025,
  EMISSION_FACTORS,

  // Calculators
  calculateLandEmissions,

  // Small utilities (useful in tests)
  roundToTwo,
  milesToKm
};

// Browser global
if (typeof window !== "undefined") {
  window.CarbonCalc = CarbonCalc;
}

// Jest / Node export
if (typeof module !== "undefined" && module.exports) {
  module.exports = CarbonCalc;
}