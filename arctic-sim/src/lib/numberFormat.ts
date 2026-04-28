export const formatKilometers = (value: number, fractionDigits = 1) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }) + ' km';

export const formatMinutes = (value: number, fractionDigits = 0) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }) + ' min';
