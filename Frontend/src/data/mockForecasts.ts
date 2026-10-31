import { ForecastPoint, ForecastModelMetrics } from '@/types'

export const HISTORICAL_FORECAST_DATA: ForecastPoint[] = [
  // 14 days historical
  { date: 'Oct 10', dayOfWeek: 'Sat', isForecast: false, historicalSales: 54, predictedSales: 52, lowerBound: 46, upperBound: 58, salesLag7: 50, salesLag14: 48, salesLag28: 46, salesRollingMean7: 49.2, salesRollingMean28: 47.1 },
  { date: 'Oct 11', dayOfWeek: 'Sun', isForecast: false, historicalSales: 61, predictedSales: 59, lowerBound: 53, upperBound: 65, salesLag7: 57, salesLag14: 55, salesLag28: 51, salesRollingMean7: 51.0, salesRollingMean28: 48.3 },
  { date: 'Oct 12', dayOfWeek: 'Mon', isForecast: false, historicalSales: 38, predictedSales: 39, lowerBound: 33, upperBound: 45, salesLag7: 36, salesLag14: 37, salesLag28: 35, salesRollingMean7: 50.4, salesRollingMean28: 48.0 },
  { date: 'Oct 13', dayOfWeek: 'Tue', isForecast: false, historicalSales: 42, predictedSales: 41, lowerBound: 35, upperBound: 47, salesLag7: 40, salesLag14: 39, salesLag28: 38, salesRollingMean7: 49.8, salesRollingMean28: 47.9 },
  { date: 'Oct 14', dayOfWeek: 'Wed', isForecast: false, historicalSales: 45, predictedSales: 44, lowerBound: 38, upperBound: 50, salesLag7: 43, salesLag14: 41, salesLag28: 40, salesRollingMean7: 49.5, salesRollingMean28: 48.1 },
  { date: 'Oct 15', dayOfWeek: 'Thu', isForecast: false, historicalSales: 49, predictedSales: 48, lowerBound: 42, upperBound: 54, salesLag7: 47, salesLag14: 44, salesLag28: 43, salesRollingMean7: 48.4, salesRollingMean28: 48.2 },
  { date: 'Oct 16', dayOfWeek: 'Fri', isForecast: false, historicalSales: 65, predictedSales: 62, lowerBound: 56, upperBound: 68, salesLag7: 62, salesLag14: 59, salesLag28: 58, salesRollingMean7: 50.6, salesRollingMean28: 49.0 },
  { date: 'Oct 17', dayOfWeek: 'Sat', isForecast: false, historicalSales: 58, predictedSales: 57, lowerBound: 51, upperBound: 63, salesLag7: 54, salesLag14: 50, salesLag28: 48, salesRollingMean7: 51.1, salesRollingMean28: 49.4 },
  { date: 'Oct 18', dayOfWeek: 'Sun', isForecast: false, historicalSales: 66, predictedSales: 64, lowerBound: 58, upperBound: 70, salesLag7: 61, salesLag14: 57, salesLag28: 55, salesRollingMean7: 51.9, salesRollingMean28: 49.8 },
  { date: 'Oct 19', dayOfWeek: 'Mon', isForecast: false, historicalSales: 41, predictedSales: 40, lowerBound: 34, upperBound: 46, salesLag7: 38, salesLag14: 36, salesLag28: 34, salesRollingMean7: 52.3, salesRollingMean28: 50.1 },
  { date: 'Oct 20', dayOfWeek: 'Tue', isForecast: false, historicalSales: 46, predictedSales: 45, lowerBound: 39, upperBound: 51, salesLag7: 42, salesLag14: 40, salesLag28: 39, salesRollingMean7: 52.9, salesRollingMean28: 50.4 },
  { date: 'Oct 21', dayOfWeek: 'Wed', isForecast: false, historicalSales: 48, predictedSales: 47, lowerBound: 41, upperBound: 53, salesLag7: 45, salesLag14: 43, salesLag28: 42, salesRollingMean7: 53.3, salesRollingMean28: 50.7 },
  { date: 'Oct 22', dayOfWeek: 'Thu', isForecast: false, historicalSales: 52, predictedSales: 50, lowerBound: 44, upperBound: 56, salesLag7: 49, salesLag14: 47, salesLag28: 45, salesRollingMean7: 53.7, salesRollingMean28: 51.0 },
  { date: 'Oct 23', dayOfWeek: 'Fri', isForecast: false, historicalSales: 71, predictedSales: 69, lowerBound: 63, upperBound: 75, salesLag7: 65, salesLag14: 62, salesLag28: 60, salesRollingMean7: 54.6, salesRollingMean28: 51.5 },
  
  // Future 7-day forecast horizon (XGBoost Simulation)
  { date: 'Oct 24', dayOfWeek: 'Sat', isForecast: true, predictedSales: 68, lowerBound: 61, upperBound: 75, salesLag7: 58, salesLag14: 54, salesLag28: 50, salesRollingMean7: 56.0, salesRollingMean28: 52.1 },
  { date: 'Oct 25', dayOfWeek: 'Sun', isForecast: true, predictedSales: 74, lowerBound: 66, upperBound: 82, salesLag7: 66, salesLag14: 61, salesLag28: 57, salesRollingMean7: 57.1, salesRollingMean28: 52.8 },
  { date: 'Oct 26', dayOfWeek: 'Mon', isForecast: true, predictedSales: 44, lowerBound: 38, upperBound: 50, salesLag7: 41, salesLag14: 38, salesLag28: 36, salesRollingMean7: 57.6, salesRollingMean28: 53.0 },
  { date: 'Oct 27', dayOfWeek: 'Tue', isForecast: true, predictedSales: 49, lowerBound: 42, upperBound: 56, salesLag7: 46, salesLag14: 42, salesLag28: 40, salesRollingMean7: 58.0, salesRollingMean28: 53.3 },
  { date: 'Oct 28', dayOfWeek: 'Wed', isForecast: true, predictedSales: 53, lowerBound: 46, upperBound: 60, salesLag7: 48, salesLag14: 45, salesLag28: 43, salesRollingMean7: 58.7, salesRollingMean28: 53.7 },
  { date: 'Oct 29', dayOfWeek: 'Thu', isForecast: true, predictedSales: 57, lowerBound: 50, upperBound: 64, salesLag7: 52, salesLag14: 49, salesLag28: 47, salesRollingMean7: 59.4, salesRollingMean28: 54.1 },
  { date: 'Oct 30', dayOfWeek: 'Fri', isForecast: true, predictedSales: 79, lowerBound: 71, upperBound: 87, salesLag7: 71, salesLag14: 65, salesLag28: 62, salesRollingMean7: 60.6, salesRollingMean28: 54.8 },
]

export const EXTENDED_FORECAST_14: ForecastPoint[] = [
  ...HISTORICAL_FORECAST_DATA,
  { date: 'Oct 31', dayOfWeek: 'Sat', isForecast: true, predictedSales: 82, lowerBound: 73, upperBound: 91, salesLag7: 68, salesLag14: 58, salesLag28: 54, salesRollingMean7: 62.1, salesRollingMean28: 55.4 },
  { date: 'Nov 01', dayOfWeek: 'Sun', isForecast: true, predictedSales: 78, lowerBound: 69, upperBound: 87, salesLag7: 74, salesLag14: 66, salesLag28: 61, salesRollingMean7: 63.0, salesRollingMean28: 55.9 },
  { date: 'Nov 02', dayOfWeek: 'Mon', isForecast: true, predictedSales: 46, lowerBound: 39, upperBound: 53, salesLag7: 44, salesLag14: 41, salesLag28: 38, salesRollingMean7: 63.3, salesRollingMean28: 56.1 },
  { date: 'Nov 03', dayOfWeek: 'Tue', isForecast: true, predictedSales: 50, lowerBound: 43, upperBound: 57, salesLag7: 49, salesLag14: 46, salesLag28: 42, salesRollingMean7: 63.4, salesRollingMean28: 56.4 },
  { date: 'Nov 04', dayOfWeek: 'Wed', isForecast: true, predictedSales: 55, lowerBound: 47, upperBound: 63, salesLag7: 53, salesLag14: 48, salesLag28: 45, salesRollingMean7: 63.7, salesRollingMean28: 56.7 },
  { date: 'Nov 05', dayOfWeek: 'Thu', isForecast: true, predictedSales: 60, lowerBound: 52, upperBound: 68, salesLag7: 57, salesLag14: 52, salesLag28: 49, salesRollingMean7: 64.1, salesRollingMean28: 57.0 },
  { date: 'Nov 06', dayOfWeek: 'Fri', isForecast: true, predictedSales: 84, lowerBound: 75, upperBound: 93, salesLag7: 79, salesLag14: 71, salesLag28: 65, salesRollingMean7: 65.6, salesRollingMean28: 57.8 },
]

export const MODEL_METRICS_DEFAULT: ForecastModelMetrics = {
  mae: 3.84,
  rmse: 5.12,
  mape: 5.9,
  r2Score: 0.948,
  horizonDays: 7,
  totalForecastUnits: 424,
  avgDailyDemand: 60.6,
  peakDay: 'Oct 30 (Friday)',
  peakUnits: 79,
}

export const ML_FEATURE_IMPORTANCE = [
  { feature: 'sales_lag_7 (Last Week Demand)', importance: 0.38, description: 'Strongest cyclical indicator for retail day-of-week demand' },
  { feature: 'sales_rolling_mean_7', importance: 0.24, description: 'Captures short-term momentum and promotion response' },
  { feature: 'day_of_week', importance: 0.16, description: 'Distinguishes peak Friday-Sunday shopping from mid-week' },
  { feature: 'sales_lag_14', importance: 0.10, description: 'Bi-weekly payroll and pay-period consumption rhythm' },
  { feature: 'sales_rolling_mean_28', importance: 0.07, description: 'Baseline monthly sales trend and seasonal drift' },
  { feature: 'sales_lag_28', importance: 0.05, description: 'Monthly calendar re-order alignment' },
]
