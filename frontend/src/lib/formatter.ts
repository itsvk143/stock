export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
};

export const formatPercent = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};
