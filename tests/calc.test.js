/**
 * tests/calc.test.js
 *
 * Jest tests for the carbon calculator logic (src/calc.js).
 * These tests cover the main business rules:
 * - Car factors are per vehicle-km (total is for the vehicle; per-person divides by passengers)
 * - Bus/rail/taxi are per passenger-km (per-person = factor * distance; total multiplies by passengers)
 * - Miles convert to kilometres
 * - Air travel returns outputs with and without Radiative Forcing (RF)
 *
 */

const CarbonCalc = require('../src/calc');

describe('CarbonCalc - land travel calculations', () => {
  test('car (petrol) 10 km, 1 passenger -> total uses vehicle-km factor', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'car', 'petrol', 1);

    expect(r.success).toBe(true);
    expect(r.basis).toBe('vehicle');
    expect(r.label).toBe('Car (Petrol)');

    // Factor: 0.16272 kgCO2e per vehicle-km
    // 10 km => 1.6272 => 1.63 (rounded to 2dp)
    expect(r.total).toBeCloseTo(1.63, 2);
    expect(r.perPerson).toBeCloseTo(1.63, 2);
  });

  test('car (petrol) 10 km, 2 passengers -> total same, per-person halves', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'car', 'petrol', 2);

    expect(r.success).toBe(true);
    expect(r.basis).toBe('vehicle');

    // Total does not change with passengers for vehicle-km basis
    expect(r.total).toBeCloseTo(1.63, 2);

    // Per-person = 1.6272 / 2 = 0.8136 => 0.81 (rounded)
    expect(r.perPerson).toBeCloseTo(0.81, 2);
  });

  test('bus (local) 10 km, 2 passengers -> passenger-km basis scales total', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'bus', 'local', 2);

    expect(r.success).toBe(true);
    expect(r.basis).toBe('passenger');
    expect(r.label).toBe('Local Bus');

    // Factor: 0.10385 kgCO2e per passenger-km
    // Per-person: 0.10385 * 10 = 1.0385 => 1.04
    // Total: 1.0385 * 2 = 2.077 => 2.08
    expect(r.perPerson).toBeCloseTo(1.04, 2);
    expect(r.total).toBeCloseTo(2.08, 2);
  });

  test('rail (national) 10 km, 3 passengers -> passenger-km basis', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'rail', 'national', 3);

    expect(r.success).toBe(true);
    expect(r.basis).toBe('passenger');
    expect(r.label).toBe('National Rail');

    // Factor: 0.03546
    // Per-person: 0.3546 => 0.35
    // Total: 0.3546 * 3 = 1.0638 => 1.06
    expect(r.perPerson).toBeCloseTo(0.35, 2);
    expect(r.total).toBeCloseTo(1.06, 2);
  });

  test('taxi (regular) 10 km, 1 passenger -> passenger-km basis', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'taxi', 'regular', 1);

    expect(r.success).toBe(true);
    expect(r.basis).toBe('passenger');
    expect(r.label).toBe('Taxi');

    // Factor: 0.14861
    // Per-person: 1.4861 => 1.49
    expect(r.perPerson).toBeCloseTo(1.49, 2);
    expect(r.total).toBeCloseTo(1.49, 2);
  });

  test('miles are converted to km correctly (car petrol)', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'miles', 'car', 'petrol', 1);

    expect(r.success).toBe(true);

    // 10 miles = 16.0934 km => rounded to 16.09 in result
    expect(r.distanceKm).toBeCloseTo(16.09, 2);

    // Total = 0.16272 * 16.0934 = 2.618... => 2.62
    expect(r.total).toBeCloseTo(2.62, 2);
  });

  test('invalid distance returns an error', () => {
    const r = CarbonCalc.calculateLandEmissions('', 'km', 'car', 'petrol', 1);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/valid distance/i);
  });

  test('invalid mode returns an error', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'boat', 'any', 1);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/invalid travel mode/i);
  });

  test('invalid option returns an error', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'car', 'rocket', 1);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/invalid option/i);
  });

  test('passengers less than 1 defaults to 1', () => {
    const r = CarbonCalc.calculateLandEmissions(10, 'km', 'car', 'petrol', 0);
    expect(r.success).toBe(true);
    expect(r.passengers).toBe(1);
  });
});

describe('CarbonCalc - air travel calculations', () => {
  test('short haul economy 100 km, 1 passenger -> returns withRF and withoutRF', () => {
    const r = CarbonCalc.calculateAirEmissions(100, 'km', 'short', 'economy', 1);

    expect(r.success).toBe(true);
    expect(r.passengers).toBe(1);

    // short haul economy:
    // with_rf: 0.12576 => 12.576 => 12.58
    // without_rf: 0.07435 => 7.435 => 7.44
    expect(r.perPersonWithRF).toBeCloseTo(12.58, 2);
    expect(r.perPersonWithoutRF).toBeCloseTo(7.44, 2);

    expect(r.totalWithRF).toBeCloseTo(12.58, 2);
    expect(r.totalWithoutRF).toBeCloseTo(7.44, 2);
  });

  test('long haul premium class (maps to premium_economy) 200 km, 2 passengers', () => {
    const r = CarbonCalc.calculateAirEmissions(200, 'km', 'long', 'premium', 2);

    expect(r.success).toBe(true);
    expect(r.flightClass).toBe('premium_economy');

    // long haul premium economy:
    // with_rf: 0.18726 => per-person 37.452 => 37.45
    // total withRF: 74.904 => 74.9 (rounded)
    expect(r.perPersonWithRF).toBeCloseTo(37.45, 2);
    expect(r.totalWithRF).toBeCloseTo(74.9, 1);
  });

  test('invalid haul returns an error', () => {
    const r = CarbonCalc.calculateAirEmissions(100, 'km', 'superlong', 'economy', 1);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/invalid haul/i);
  });

  test('invalid distance returns an error', () => {
    const r = CarbonCalc.calculateAirEmissions(-5, 'km', 'short', 'economy', 1);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/valid distance/i);
  });

  test('unknown class falls back to average (and provides a warning)', () => {
    // In this condensed set, "short" haul does not include "first".
    const r = CarbonCalc.calculateAirEmissions(100, 'km', 'short', 'first', 1);

    expect(r.success).toBe(true);
    expect(r.flightClass).toBe('average');
    expect(r.warning).toBeTruthy();

    // short haul average:
    // with_rf: 0.12786 => 12.786 => 12.79
    expect(r.perPersonWithRF).toBeCloseTo(12.79, 2);
  });

  test('miles conversion works for air as well', () => {
    const r = CarbonCalc.calculateAirEmissions(10, 'miles', 'short', 'economy', 1);

    expect(r.success).toBe(true);
    // 10 miles => 16.09 km (rounded in result)
    expect(r.distanceKm).toBeCloseTo(16.09, 2);

    // with_rf per person = 0.12576 * 16.0934 = 2.024... => 2.02
    expect(r.perPersonWithRF).toBeCloseTo(2.02, 2);
  });

  test('passengers less than 1 defaults to 1 (air)', () => {
    const r = CarbonCalc.calculateAirEmissions(100, 'km', 'short', 'economy', -3);
    expect(r.success).toBe(true);
    expect(r.passengers).toBe(1);
  });
});
