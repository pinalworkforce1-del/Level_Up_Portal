(() => {
  'use strict';

  const TAKE_HOME_RATE = 0.78;
  const HOURS_PER_MONTH = 40 * 52 / 12;
  const MODULE_ID = 'work-life-plan';

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function normalizeLevel(raw) {
    const value = String(raw || '').toLowerCase();
    if (value === 'median' || value === 'typical') {
      return { key: 'median', label: 'Typical local pay' };
    }
    if (value === 'higher' || value === 'experienced') {
      return { key: 'higher', label: 'Higher-end potential' };
    }
    return { key: 'entry', label: 'Estimated entry pay' };
  }

  function wageFor(job, level) {
    if (!job) return 0;
    if (level.key === 'median') return Number(job.medianHourly || 0);
    if (level.key === 'higher') return Number(job.experiencedHourly || 0);
    return Number(job.entryHourly || 0);
  }

  function patchWorkLifeData(data) {
    if (!data || typeof data !== 'object') return data;

    const level = normalizeLevel(data.selected_wage_level);
    const hourly = wageFor(data.selected_occupation, level);
    const monthlyPlan = Number(data.monthly_plan?.total || 0);
    const estimatedTakeHome = hourly > 0
      ? roundMoney(hourly * HOURS_PER_MONTH * TAKE_HOME_RATE)
      : 0;
    const monthlyGap = roundMoney(monthlyPlan - estimatedTakeHome);
    const gapStatus = monthlyGap > 0.5
      ? 'shortfall'
      : monthlyGap < -0.5
        ? 'surplus'
        : 'meets';

    return {
      ...data,
      selected_wage_level: level.key,
      selected_wage_label: level.label,
      selected_wage_hourly: hourly,
      affordability: {
        ...(data.affordability || {}),
        selected_hourly_wage: hourly,
        estimated_take_home_monthly: estimatedTakeHome,
        monthly_gap: monthlyGap,
        gap_status: gapStatus,
        annual_gap_equivalent: roundMoney(monthlyGap * 12),
        take_home_rate_assumption: TAKE_HOME_RATE
      }
    };
  }

  function install() {
    const sync = window.LevelUpCareerTreeSync;
    if (!sync?.save || sync.__workLifeWageNormalizerInstalled) return false;

    const originalSave = sync.save.bind(sync);
    sync.save = function(moduleId, data, options) {
      if (moduleId === MODULE_ID) {
        data = patchWorkLifeData(data);
      }
      return originalSave(moduleId, data, options);
    };
    sync.__workLifeWageNormalizerInstalled = true;
    return true;
  }

  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 25);
    setTimeout(() => clearInterval(timer), 5000);
  }
})();
