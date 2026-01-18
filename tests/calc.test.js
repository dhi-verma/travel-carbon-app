/**
 * tests/calc.test.js
 *
 * Jest tests for the carbon calculator logic (src/calc.js).
 * These tests cover the main business rules for the MVP:
 * - Car factors are per vehicle-km (total is for the vehicle; per-person divides by passengers)
 * - Miles convert to kilometres
 * - Invalid inputs return user-friendly errors
 * - Passengers less than 1 default to 1
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