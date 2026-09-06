/** Compliance period helpers aligned with CLIENT complianceService. */

export const COMPLIANCE_MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

export const PERIODS_BY_FREQUENCY = {
  monthly: COMPLIANCE_MONTHS,
  quarterly: ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'],
  'half-yearly': ['H1 (Apr-Sep)', 'H2 (Oct-Mar)'],
  halfyearly: ['H1 (Apr-Sep)', 'H2 (Oct-Mar)'],
  yearly: ['Annual'],
  annual: ['Annual'],
};

export const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half-yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
];

export const normalizeFrequency = (frequency) => {
  const key = String(frequency || '').toLowerCase().replace(/_/g, '-');
  if (key === 'halfyearly' || key === 'half-year') return 'half-yearly';
  if (key === 'annual' || key === 'annually') return 'yearly';
  return key;
};

export const getCurrentComplianceYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
};

export const getPeriodOptions = (frequency) => {
  const key = normalizeFrequency(frequency) || 'monthly';
  return PERIODS_BY_FREQUENCY[key] || COMPLIANCE_MONTHS;
};

export const getComplianceYearOptions = (span = 5) => {
  const currentStart = Number(getCurrentComplianceYear().split('-')[0]);
  const half = Math.floor(span / 2);
  return Array.from({ length: span }, (_, index) => {
    const start = currentStart - half + index;
    return `${start}-${start + 1}`;
  });
};
