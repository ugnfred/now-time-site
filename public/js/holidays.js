(function () {
  const HOLIDAY_REGION_LABELS = {
    IN: 'India',
    US: 'United States',
    GB: 'United Kingdom',
    AE: 'United Arab Emirates',
    AU: 'Australia',
    GLOBAL: 'Global'
  };

  const TZ_REGION_MAP = {
    'Asia/Kolkata': 'IN',
    'Asia/Dubai': 'AE',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'Europe/London': 'GB',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU'
  };

  function getRegionFromLocale() {
    const locale = (Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || '').toUpperCase();
    const match = locale.match(/-([A-Z]{2})\b/);
    return match ? match[1] : null;
  }

  function inferHolidayRegion() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz && TZ_REGION_MAP[tz]) return TZ_REGION_MAP[tz];

    const localeRegion = getRegionFromLocale();
    if (localeRegion && HOLIDAY_REGION_LABELS[localeRegion]) return localeRegion;

    if (tz.startsWith('Asia/')) return 'IN';
    if (tz.startsWith('Europe/')) return 'GB';
    if (tz.startsWith('America/')) return 'US';
    if (tz.startsWith('Australia/')) return 'AU';

    return 'GLOBAL';
  }

  function easterDate(y) {
    const f = Math.floor, a = y % 19, b = f(y / 100), c = y % 100, d = f(b / 4), e = b % 4,
      g = f((8 * b + 13) / 25), h = (19 * a + b - d - g + 15) % 30, i = f(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = f((a + 11 * h + 19 * l) / 433),
      n = f((h + l - 7 * m + 90) / 25), p = (h + l - 7 * m + 33 * n + 19) % 32;
    return new Date(y, n - 1, p);
  }

  function nthWeekday(y, mo, dow, n) {
    const d = new Date(y, mo, 1);
    let count = 0;
    while (true) {
      if (d.getDay() === dow) count++;
      if (count === n) return new Date(d);
      d.setDate(d.getDate() + 1);
    }
  }

  function lastWeekday(y, mo, dow) {
    const d = new Date(y, mo + 1, 0);
    while (d.getDay() !== dow) d.setDate(d.getDate() - 1);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function getHolidaysForRegion(year, region) {
    const listByRegion = {
      IN: [
        { name: "Republic Day", date: new Date(year, 0, 26) },
        { name: "Holi", date: new Date(year, 2, 14) },
        { name: "Independence Day", date: new Date(year, 7, 15) },
        { name: "Gandhi Jayanti", date: new Date(year, 9, 2) },
        { name: "Diwali", date: new Date(year, 9, 20) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
      ],
      US: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        { name: "Memorial Day", date: lastWeekday(year, 4, 1) },
        { name: "Independence Day", date: new Date(year, 6, 4) },
        { name: "Labor Day", date: nthWeekday(year, 8, 1, 1) },
        { name: "Thanksgiving", date: nthWeekday(year, 10, 4, 4) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
      ],
      GB: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        { name: "Good Friday", date: addDays(easterDate(year), -2) },
        { name: "Early May Bank Holiday", date: nthWeekday(year, 4, 1, 1) },
        { name: "Summer Bank Holiday", date: lastWeekday(year, 7, 1) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
        { name: "Boxing Day", date: new Date(year, 11, 26) },
      ],
      AE: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        { name: "Eid al-Fitr", date: new Date(year, 2, 30) },
        { name: "Arafat Day", date: new Date(year, 5, 5) },
        { name: "Eid al-Adha", date: new Date(year, 5, 6) },
        { name: "UAE National Day", date: new Date(year, 11, 2) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
      ],
      AU: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        { name: "Australia Day", date: new Date(year, 0, 26) },
        { name: "Good Friday", date: addDays(easterDate(year), -2) },
        { name: "ANZAC Day", date: new Date(year, 3, 25) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
        { name: "Boxing Day", date: new Date(year, 11, 26) },
      ],
      GLOBAL: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        { name: "Labour Day", date: new Date(year, 4, 1) },
        { name: "Christmas Day", date: new Date(year, 11, 25) },
        { name: "New Year's Eve", date: new Date(year, 11, 31) },
      ]
    };

    return listByRegion[region] || listByRegion.GLOBAL;
  }

  function getHolidays(year) {
    return getHolidaysForRegion(year, inferHolidayRegion());
  }

  function updateHolidays() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const region = inferHolidayRegion();
    const all = [
      ...getHolidaysForRegion(now.getFullYear(), region),
      ...getHolidaysForRegion(now.getFullYear() + 1, region)
    ];
    const upcoming = all.filter(h => h.date >= now).sort((a, b) => a.date - b.date).slice(0, 3);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    upcoming.forEach((h, i) => {
      const days = Math.round((h.date - now) / 86400000);
      const regionLabel = HOLIDAY_REGION_LABELS[region] || HOLIDAY_REGION_LABELS.GLOBAL;
      const nameEl = document.getElementById(`hol${i + 1}-name`);
      const dateEl = document.getElementById(`hol${i + 1}-date`);
      const daysEl = document.getElementById(`hol${i + 1}-days`);
      if (!nameEl || !dateEl || !daysEl) return;
      nameEl.textContent = `${h.name} (${regionLabel})`;
      dateEl.textContent = `${months[h.date.getMonth()]} ${h.date.getDate()}, ${h.date.getFullYear()}`;
      daysEl.textContent = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
    });
  }

  window.HOLIDAY_REGION_LABELS = HOLIDAY_REGION_LABELS;
  window.inferHolidayRegion = inferHolidayRegion;
  window.getHolidaysForRegion = getHolidaysForRegion;
  window.getHolidays = getHolidays;
  window.updateHolidays = updateHolidays;
})();
