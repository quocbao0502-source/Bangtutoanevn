import { ElectricPole, EVNMultiTaskCostBreakdown, MaintenanceRates } from '../types/pole';
import { calculateEVNMultiTaskCost, numberToVietnameseWords } from './calculations';

// Sum the individual estimates: concurrency discounts are applied at each pole,
// never a second time to the whole route. An empty route has a zero estimate.
export function aggregateEstimates(poles: ElectricPole[], rates: MaintenanceRates): EVNMultiTaskCostBreakdown {
  const result = calculateEVNMultiTaskCost([], 0, rates);
  const additive = [
    'tasksCount', 'rawTotalMaterial', 'rawTotalHotline', 'rawTotalLabor', 'rawTotalMachinery',
    'finalTotalMaterial', 'finalTotalHotline', 'totalMaterialCost', 'finalTotalLabor',
    'finalTotalMachinery', 'directCost', 'totalIndirectCost', 'taxableIncomeBeforeTax',
    'transportDistanceKm', 'workerVehicleCost', 'bucketVehicleCost', 'craneVehicleCost',
    'totalTransportationCost', 'trafficSafetyShifts', 'totalTrafficSafetyCost',
    'constructionValueBeforeTax', 'surveyLaborCost', 'surveyVehicleCost', 'totalSurveyCost',
    'planPreparationCost', 'totalPlanCost', 'totalEstimateBeforeTax', 'vatAmount',
    'totalEstimateAfterTax', 'distanceAllowance', 'totalEstimatedCost',
  ] as const;
  for (const pole of poles) {
    const estimate = calculateEVNMultiTaskCost(
      pole.tasks ?? [],
      pole.distanceFromBaseKm,
      rates,
      pole.estimateOptions,
      pole.voltageLevel
    );
    for (const key of additive) result[key] += estimate[key];
    result.tasksDetail.push(...estimate.tasksDetail.map(task => ({ ...task, description: `${pole.code}: ${task.description}` })));
  }
  result.concurrentLaborMultiplier = result.rawTotalLabor ? result.finalTotalLabor / result.rawTotalLabor : 1;
  result.concurrentMachineryMultiplier = result.rawTotalMachinery ? result.finalTotalMachinery / result.rawTotalMachinery : 1;
  result.totalInWords = numberToVietnameseWords(result.totalEstimateAfterTax);
  return result;
}
