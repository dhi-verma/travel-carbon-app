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
    },
    taxis: {
      regular_taxi: { unit: "passenger.km", kgco2e_per_unit: 0.14861 },
      black_cab: { unit: "passenger.km", kgco2e_per_unit: 0.20402 }
    },
    bus: {
      average_local: { unit: "passenger.km", kgco2e_per_unit: 0.10385 },
      london: { unit: "passenger.km", kgco2e_per_unit: 0.06875 },
      coach: { unit: "passenger.km", kgco2e_per_unit: 0.02776 }
    },
    rail: {
      national_rail: { unit: "passenger.km", kgco2e_per_unit: 0.03546 },
      underground: { unit: "passenger.km", kgco2e_per_unit: 0.0278 },
      light_rail_tram: { unit: "passenger.km", kgco2e_per_unit: 0.0286 },
      international_rail: { unit: "passenger.km", kgco2e_per_unit: 0.00446 }
    }
  },

  air: {
    domestic_to_from_uk: {
      average: { unit: "passenger.km", with_rf: 0.22928, without_rf: 0.13552 }
    },
    short_haul_to_from_uk: {
      average: { unit: "passenger.km", with_rf: 0.12786, without_rf: 0.07559 },
      economy: { unit: "passenger.km", with_rf: 0.12576, without_rf: 0.07435 },
      business: { unit: "passenger.km", with_rf: 0.18863, without_rf: 0.11152 }
    },
    long_haul_to_from_uk: {
      average: { unit: "passenger.km", with_rf: 0.15282, without_rf: 0.09043 },
      economy: { unit: "passenger.km", with_rf: 0.11704, without_rf: 0.06926 },
      premium_economy: { unit: "passenger.km", with_rf: 0.18726, without_rf: 0.11081 },
      business: { unit: "passenger.km", with_rf: 0.3394, without_rf: 0.20083 },
      first: { unit: "passenger.km", with_rf: 0.46814, without_rf: 0.27701 }
    },
    international_non_uk: {
      average: { unit: "passenger.km", with_rf: 0.14253, without_rf: 0.0842 },
      economy: { unit: "passenger.km", with_rf: 0.10916, without_rf: 0.06449 },
      premium_economy: { unit: "passenger.km", with_rf: 0.17465, without_rf: 0.10318 },
      business: { unit: "passenger.km", with_rf: 0.31656, without_rf: 0.18701 },
      first: { unit: "passenger.km", with_rf: 0.43663, without_rf: 0.25794 }
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
    },

    bus: {
      // Alias: UI uses "local"
      local: { label: "Local Bus", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.bus.average_local.kgco2e_per_unit },
      coach: { label: "Coach", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.bus.coach.kgco2e_per_unit },
      // Optional extra for future UI
      london: { label: "Bus (London)", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.bus.london.kgco2e_per_unit },
      average_local: { label: "Bus (Average local)", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.bus.average_local.kgco2e_per_unit }
    },

    rail: {
      // Aliases: UI uses "national" and "metro"
      national: { label: "National Rail", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.rail.national_rail.kgco2e_per_unit },
      metro: { label: "Metro / Tram", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.rail.underground.kgco2e_per_unit },
      // Optional extra for future UI
      underground: { label: "Underground", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.rail.underground.kgco2e_per_unit },
      light_rail_tram: { label: "Light rail / Tram", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.rail.light_rail_tram.kgco2e_per_unit },
      international_rail: { label: "International Rail", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.rail.international_rail.kgco2e_per_unit }
    },

    taxi: {
      // Alias: UI uses "regular"
      regular: { label: "Taxi", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.taxis.regular_taxi.kgco2e_per_unit },
      // Optional extra for future UI
      regular_taxi: { label: "Taxi (Regular)", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.taxis.regular_taxi.kgco2e_per_unit },
      black_cab: { label: "Taxi (Black cab)", basis: "passenger", unit: "passenger.km", factor: FACTORS_2025.land.taxis.black_cab.kgco2e_per_unit }
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

function normalizeFlightClass(flightClass) {
  // UI uses "premium"; dataset uses "premium_economy"
  if (flightClass === "premium") return "premium_economy";
  return flightClass;
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