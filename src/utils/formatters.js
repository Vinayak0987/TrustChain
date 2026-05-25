export function scoreColor(score) {
  if (score >= 70) return 'var(--color-success)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function scoreTier(score) {
  if (score >= 85) return { name: 'High — Excellent Standing', pill: 'pill-success', level: 'Level 4 of 4' };
  if (score >= 70) return { name: 'Medium-High — Getting Stronger', pill: 'pill-success', level: 'Level 3 of 4' };
  if (score >= 40) return { name: 'Medium — Building Trust', pill: 'pill-warning', level: 'Level 2 of 4' };
  return { name: 'Low — Just Starting', pill: 'pill-danger', level: 'Level 1 of 4' };
}

export function calcLoan(amount, weeks, podStrength, verification) {
  const baseRate = 18;
  const podDiscount = podStrength === 'strong' ? 3 : podStrength === 'average' ? 1.5 : 0;
  const verifDiscount = verification === 'ngo' ? 4 : verification === 'phone' ? 0.5 : 0;
  const rate = Math.max(8, baseRate - podDiscount - verifDiscount);
  const weeklyRate = rate / 100 / 52;
  const weeklyPayment = (amount * weeklyRate) / (1 - Math.pow(1 + weeklyRate, -weeks));
  return {
    rate: rate.toFixed(1),
    weekly: Math.ceil(weeklyPayment),
  };
}

export function calcSimRate(score) {
  return Math.max(8, Math.min(22, (24 - (score / 100) * 16))).toFixed(1);
}
