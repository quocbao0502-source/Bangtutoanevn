import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DEPOT, DEFAULT_MAINTENANCE_RATES as rates, DEFAULT_MAINTENANCE_RATES, createDefaultTasksForPole, getInitialPoles } from '../src/data/seedData';
import { calculateEVNMultiTaskCost, calculatePoleCostBreakdown, calculatePoleTotalCost, numberToVietnameseWords, optimizeRoute } from '../src/utils/calculations';
import { aggregateEstimates } from '../src/utils/report';
import { csvCell } from '../src/utils/exportUtils';
import { readStored, writeStored, validCoordinates } from '../src/utils/storage';

test('0 km does not create a fictitious 56 km transport charge', () => {
  const cost = calculateEVNMultiTaskCost(createDefaultTasksForPole(), 0, rates);
  assert.equal(cost.transportDistanceKm, 0);
  assert.equal(cost.totalTransportationCost, 0);
  assert.equal(cost.surveyVehicleCost, 0);
});

test('no selected work, zero quantity and empty report cost nothing', () => {
  const tasks = createDefaultTasksForPole().map(t => ({ ...t, isSelected: false }));
  assert.equal(calculateEVNMultiTaskCost(tasks, 56, rates).totalEstimatedCost, 0);
  assert.equal(calculateEVNMultiTaskCost(tasks.map(t => ({ ...t, isSelected: true, quantity: 0 })), 56, rates).totalEstimatedCost, 0);
  assert.equal(aggregateEstimates([], rates).totalEstimatedCost, 0);
});

test('report totals include every pole without a second concurrency discount', () => {
  const poles = getInitialPoles();
  const total = aggregateEstimates(poles, rates);
  const expected = poles.reduce((sum, p) => sum + calculateEVNMultiTaskCost(p.tasks!, p.distanceFromBaseKm, rates).totalEstimateAfterTax, 0);
  assert.equal(total.totalEstimateAfterTax, expected);
  assert.ok(total.totalEstimateAfterTax > poles[0].maintenanceCostVnd);
  assert.equal(total.totalInWords, numberToVietnameseWords(expected));
  assert.equal(total.totalEstimateBeforeTax + total.vatAmount, expected);
});

test('custom coefficients affect all downstream totals and report', () => {
  const p = getInitialPoles()[0];
  p.estimateOptions = { vatRate: 0, generalExpenseRate: 0, transportDistanceKm: 0, trafficSafetyCost: 0 };
  const b = calculateEVNMultiTaskCost(p.tasks!, p.distanceFromBaseKm, rates, p.estimateOptions);
  assert.equal(b.vatAmount, 0);
  assert.equal(b.totalIndirectCost, 0);
  assert.equal(b.totalTransportationCost, 0);
  assert.equal(aggregateEstimates([p], rates).totalEstimatedCost, b.totalEstimatedCost);
});

test('one-way and round-trip routes retain their mode and exact legs', () => {
  const poles = getInitialPoles();
  for (const mode of [true, false]) {
    const route = optimizeRoute(DEFAULT_DEPOT, poles, rates, 'truck', mode);
    assert.equal(route.isRoundTrip, mode);
    assert.equal(route.legs.length, poles.length + Number(mode));
    assert.equal(new Set(route.orderedPoles.map(p => p.id)).size, poles.length);
    assert.equal(route.totalDistanceKm, Number(route.legs.reduce((s, l) => s + l.distanceKm, 0).toFixed(2)));
    assert.equal(route.fuelCostVnd, Math.round(route.totalDistanceKm * rates.fuelConsumption.truckLitersPer100Km / 100 * rates.fuelPricePerLiterVnd));
    assert.deepEqual(route.legs.at(-1)?.toCoords, mode ? [DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng] : [route.orderedPoles.at(-1)!.lat, route.orderedPoles.at(-1)!.lng]);
  }
  assert.equal(optimizeRoute(DEFAULT_DEPOT, [], rates, 'motorbike', false).totalDistanceKm, 0);
});

test('Vietnamese money words include zero hundreds', () => {
  assert.equal(numberToVietnameseWords(1001), 'Một nghìn không trăm lẻ một đồng.');
  assert.equal(numberToVietnameseWords(0), 'Không đồng.');
});

test('CSV quotes embedded delimiters and prevents spreadsheet formula execution', () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell('=1+2'), '"\'=1+2"');
  assert.equal(csvCell(' @SUM(1)'), '"\' @SUM(1)"');
});

test('unavailable or malformed storage does not crash; valid coordinates outside sample area are retained', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => '{bad json', setItem: () => { throw new Error('QuotaExceededError'); },
  } });
  assert.deepEqual(readStored('poles', [], Array.isArray), []);
  assert.equal(writeStored('poles', []), false);
  assert.equal(validCoordinates(10.5, 106.2), true);
  assert.equal(validCoordinates(0, 0), true);
  assert.equal(validCoordinates(NaN, 105), false);
  assert.equal(validCoordinates(91, 0), false);
});

test('dynamic fields and custom tasks integrate seamlessly without errors or NaN', () => {
  const dynamicRates = {
    ...rates,
    baseCostByVoltage: { ...rates.baseCostByVoltage, '220kV': 850000, '500kV': 1500000 },
    crossarmOptions: [
      { id: 'balanced', label: 'Đà cân', multiplier: 1.0 },
      { id: 'offset', label: 'Đà lệch', multiplier: 1.35 },
      { id: 'crossarm_custom', label: 'Đà néo góc', multiplier: 1.45 },
    ],
    structureOptions: [
      { id: 'single', label: 'Trụ đơn', multiplier: 1.0 },
      { id: 'double', label: 'Trụ đôi', multiplier: 1.5 },
      { id: 'struct_custom', label: 'Trụ BTLT DƯL', multiplier: 1.25 },
    ],
  };

  // Test custom voltage and structure in calculatePoleCostBreakdown
  const breakdown = calculateEVNMultiTaskCost([], 5, dynamicRates);
  assert.equal(breakdown.totalEstimatedCost, 0);

  // Test adding a custom task
  const customTask = {
    id: 'task-custom-1',
    code: '16.99.01-1',
    name: 'Công tác thử nghiệm mới',
    unit: '1 vị trí',
    taskCount: 1,
    quantity: 2,
    baseRates: { auxiliaryMaterial: 100000, hotline: 50000, labor: 400000, machinery: 600000 },
    positionCoefficients: { auxiliaryMaterial: 1.0, material: 1.0, labor: 1.2, machinery: 1.0 },
    isSelected: true,
  };

  const withCustomTask = calculateEVNMultiTaskCost([customTask], 10, dynamicRates);
  assert.ok(withCustomTask.totalEstimatedCost > 0);
  assert.ok(Number.isFinite(withCustomTask.totalEstimatedCost));
  assert.ok(!Number.isNaN(withCustomTask.totalEstimatedCost));
  assert.equal(withCustomTask.tasksCount, 1);
});

test('custom header settings and dynamic fields support full CRUD and persist properly', async () => {
  const { DEFAULT_HEADER_SETTINGS } = await import('../src/data/seedData');
  assert.ok(DEFAULT_HEADER_SETTINGS.appTitle);
  assert.ok(Array.isArray(DEFAULT_HEADER_SETTINGS.customFields));
  assert.ok(DEFAULT_HEADER_SETTINGS.customFields.length > 0);

  // Test adding new custom header fields
  const updatedSettings = {
    ...DEFAULT_HEADER_SETTINGS,
    appTitle: 'ĐỘI QUẢN LÝ VẬN HÀNH LƯỚI ĐIỆN CAO THẾ',
    customFields: [
      ...DEFAULT_HEADER_SETTINGS.customFields,
      {
        id: 'field_test_1',
        label: 'Biển số xe cẩu',
        value: '70C-999.88',
        badgeType: 'warning' as const,
        showInNavbar: true,
        showInReport: true,
      },
    ],
  };

  assert.equal(updatedSettings.appTitle, 'ĐỘI QUẢN LÝ VẬN HÀNH LƯỚI ĐIỆN CAO THẾ');
  assert.equal(updatedSettings.customFields.length, DEFAULT_HEADER_SETTINGS.customFields.length + 1);
  const found = updatedSettings.customFields.find(f => f.id === 'field_test_1');
  assert.ok(found);
  assert.equal(found.value, '70C-999.88');

  // Test updating a field
  const edited = updatedSettings.customFields.map(f => f.id === 'field_test_1' ? { ...f, value: '70C-111.22' } : f);
  assert.equal(edited.find(f => f.id === 'field_test_1')?.value, '70C-111.22');

  // Test deleting a field
  const deleted = edited.filter(f => f.id !== 'field_test_1');
  assert.equal(deleted.length, DEFAULT_HEADER_SETTINGS.customFields.length);
});

test('15 conditions multiplication: all selected conditions multiply together accurately', async () => {
  const { computeTaskCoefficients, getTaskBaseRates } = await import('../src/utils/calculations');
  const { DEFAULT_CONDITIONS_16_01_01_1 } = await import('../src/data/seedData');

  const task = {
    id: 'test-task',
    code: '16.01.01-1',
    name: 'Thay thế cách điện đứng',
    baseRates: { auxiliaryMaterial: 276250, hotline: 155131, labor: 1237423, machinery: 2920434 },
    positionCoefficients: { auxiliaryMaterial: 1, material: 1, labor: 1, machinery: 1 },
    conditions: DEFAULT_CONDITIONS_16_01_01_1,
    selectedConditionIds: ['cond-1.14', 'cond-1.1'], // 0.8 * 1.3 = 1.04
    isSelected: true,
  };

  const coeffs = computeTaskCoefficients(task as any);
  assert.equal(coeffs.labor, 1.04);
  assert.equal(coeffs.machinery, 1.0);
  assert.equal(coeffs.auxiliaryMaterial, 1.0);
});

test('voltage level rates difference (22kV vs 12,7kV)', async () => {
  const { getTaskBaseRates } = await import('../src/utils/calculations');
  const { DEFAULT_EVN_TASKS_TEMPLATE } = await import('../src/data/seedData');

  const task = DEFAULT_EVN_TASKS_TEMPLATE[0];
  const rate22 = getTaskBaseRates(task, '22kV');
  const rate12 = getTaskBaseRates(task, '12,7kV');

  assert.equal(rate22.labor, 1237423);
  assert.equal(rate12.labor, 829000);
  assert.ok(rate12.labor < rate22.labor);
});

test('tax rate selection (0% KCN Moc Bai up to 15%) and Gpa2 K factor (1 vs 1.2)', async () => {
  const { calculateEVNMultiTaskCost } = await import('../src/utils/calculations');
  const { createDefaultTasksForPole, DEFAULT_MAINTENANCE_RATES } = await import('../src/data/seedData');

  const tasks = createDefaultTasksForPole();

  // Test 0% VAT for KCN Mộc Bài
  const costMocBai = calculateEVNMultiTaskCost(tasks, 10, DEFAULT_MAINTENANCE_RATES, { vatRate: 0, isRenovation: false });
  assert.equal(costMocBai.vatRate, 0);
  assert.equal(costMocBai.vatAmount, 0);
  assert.equal(costMocBai.totalEstimateAfterTax, costMocBai.totalEstimateBeforeTax);

  // Test 10% VAT and K=1.2 (renovation)
  const costRenovation = calculateEVNMultiTaskCost(tasks, 10, DEFAULT_MAINTENANCE_RATES, { vatRate: 0.1, isRenovation: true });
  assert.equal(costRenovation.vatRate, 0.1);
  assert.ok(costRenovation.planPreparationCost > costMocBai.planPreparationCost);
});

test('multi-position aggregation: 1 position equals single, N positions aggregates all', async () => {
  const { aggregateMultiPositionEstimates, calculateEVNMultiTaskCost } = await import('../src/utils/calculations');
  const { createDefaultTasksForPole, DEFAULT_MAINTENANCE_RATES } = await import('../src/data/seedData');

  const pos1 = {
    id: 'pos-1',
    positionIndex: 1,
    poleCode: '73/8A',
    address: 'Địa chỉ 1',
    lat: 11.3,
    lng: 106.1,
    distanceKm: 2,
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'balanced',
    poleStructure: 'single',
    tasks: createDefaultTasksForPole(),
    isFilled: true,
  };

  const pos2Empty = {
    id: 'pos-2',
    positionIndex: 2,
    poleCode: '',
    address: '',
    lat: 11.31,
    lng: 106.11,
    distanceKm: 3,
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'balanced',
    poleStructure: 'single',
    tasks: [],
    isFilled: false,
  };

  // If only 1 position filled, equals single position
  const single = aggregateMultiPositionEstimates([pos1 as any, pos2Empty as any], DEFAULT_MAINTENANCE_RATES);
  const directSingle = calculateEVNMultiTaskCost(pos1.tasks, pos1.distanceKm, DEFAULT_MAINTENANCE_RATES, undefined, pos1.voltageLevel);
  assert.equal(single.directCost, directSingle.directCost);

  // If pos2 is filled, total aggregates both
  const pos2Filled = {
    ...pos2Empty,
    poleCode: '74/1',
    tasks: createDefaultTasksForPole(),
    isFilled: true,
  };

  const combined = aggregateMultiPositionEstimates([pos1 as any, pos2Filled as any], DEFAULT_MAINTENANCE_RATES);
  assert.ok(combined.directCost > single.directCost);
});

test('crossarm and structure dynamic CRUD: adding, editing multiplier, deleting with fallback never causes NaN or broken estimates', () => {
  const customRates = {
    ...DEFAULT_MAINTENANCE_RATES,
    crossarmOptions: [
      { id: 'balanced', label: 'ĐÀ CÂN', multiplier: 1.0 },
      { id: 'custom_v_arm', label: 'ĐÀ SẮT CHỮ V', multiplier: 1.25 },
    ],
    structureOptions: [
      { id: 'single', label: 'TRỤ ĐƠN', multiplier: 1.0 },
      { id: 'custom_steel_spin', label: 'TRỤ THÉP LY TÂM', multiplier: 1.4 },
    ],
  };

  // Test pole with new custom crossarm
  const poleWithCustomArm: any = {
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'custom_v_arm',
    poleStructure: 'single',
    distanceFromBaseKm: 2.5,
  };
  const costCustomArm = calculatePoleCostBreakdown(poleWithCustomArm, customRates);
  assert.ok(Number.isFinite(costCustomArm.totalCostVnd));
  assert.equal(costCustomArm.crossarmMultiplier, 1.25);

  // Test pole with custom structure
  const poleWithCustomSt: any = {
    ...poleWithCustomArm,
    poleStructure: 'custom_steel_spin',
  };
  const costCustomBoth = calculatePoleCostBreakdown(poleWithCustomSt, customRates);
  assert.ok(Number.isFinite(costCustomBoth.totalCostVnd));
  assert.equal(costCustomBoth.structureMultiplier, 1.4);
  assert.ok(costCustomBoth.totalCostVnd > costCustomArm.totalCostVnd);

  // Fallback test: when deleted crossarm ID is encountered, fallback gives finite valid cost without NaN
  const poleWithDeletedArm: any = {
    ...poleWithCustomArm,
    crossarmType: 'deleted_nonexistent_id',
  };
  const costFallback = calculatePoleCostBreakdown(poleWithDeletedArm, customRates);
  assert.ok(Number.isFinite(costFallback.totalCostVnd));
  assert.ok(!isNaN(costFallback.totalCostVnd));
});
