// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
let is24h = StorageUtil.getJSON('is24h', false);
let selectedTz = null;
let worldClocks = StorageUtil.getJSON('worldClocks', null) || [
  {city:'New York',   tz:'America/New_York'},
  {city:'London',     tz:'Europe/London'},
  {city:'Paris',      tz:'Europe/Paris'},
  {city:'Dubai',      tz:'Asia/Dubai'},
  {city:'Mumbai',     tz:'Asia/Kolkata'},
  {city:'Tokyo',      tz:'Asia/Tokyo'},
  {city:'Sydney',     tz:'Australia/Sydney'},
  {city:'Los Angeles',tz:'America/Los_Angeles'},
];
let alarms = StorageUtil.getJSON('alarms', []);

// Sync h24 button
document.getElementById('h24-btn').style.color = is24h ? 'var(--accent)' : '';

// ═══════════════════════════════════════════════════
//  CURSOR
// ═══════════════════════════════════════════════════
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseenter', () => cursor.style.opacity = '1');
document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
document.querySelectorAll('button,a,input,select,.clock-card,.cal-day').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('big'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
});

// ═══════════════════════════════════════════════════
// Helpers moved to /js/core/time.js

//  THEME
// ═══════════════════════════════════════════════════
function toggle24h() {
  is24h = !is24h;
  document.getElementById('h24-btn').style.color = is24h ? 'var(--accent)' : '';
  localStorage.setItem('is24h', is24h);
  updateSun(); // re-render sunrise/sunset in correct format
}

function toggleKbd() {
  document.getElementById('kbd-hint').classList.toggle('show');
}

// View switching moved to /js/ui/navigation.js

// ═══════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 'c') copyVal('unix-val','unix');
  if (k === 't') toggle24h();
  if (k === 'l') { const ids=THEMES.map(t=>t.id); const i=ids.indexOf(currentTheme); applyTheme(ids[(i+1)%ids.length]); }
  if (k === '?') toggleKbd();
  if (k === '1') { switchView('clock'); document.querySelectorAll('.nav-btn')[0].classList.add('active'); }
  if (k === '2') { switchView('stopwatch'); document.querySelectorAll('.nav-btn')[1].classList.add('active'); }
  if (k === '3') { switchView('timer'); document.querySelectorAll('.nav-btn')[2].classList.add('active'); }
  if (k === '4') { switchView('calendar'); document.querySelectorAll('.nav-btn')[4].classList.add('active'); }
  if (k === '5') { switchView('converter'); document.querySelectorAll('.nav-btn')[5].classList.add('active'); }
  if (k === '6') { switchView('alarm'); document.querySelectorAll('.nav-btn')[6].classList.add('active'); }
});

// ═══════════════════════════════════════════════════
//  ANALOG CLOCK
// ═══════════════════════════════════════════════════
function updateAnalog(h, m, s) {
  const hDeg = (h % 12) * 30 + m * 0.5;
  const mDeg = m * 6 + s * 0.1;
  const sDeg = s * 6;
  document.getElementById('hand-hour').style.transform = `rotate(${hDeg}deg)`;
  document.getElementById('hand-min').style.transform  = `rotate(${mDeg}deg)`;
  document.getElementById('hand-sec').style.transform  = `rotate(${sDeg}deg)`;
}

// ═══════════════════════════════════════════════════
//  SUN / MOON
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
//  SUN / MOON  — robust NOAA-based algorithm
// ═══════════════════════════════════════════════════

/* Returns sunrise & sunset as decimal hours in LOCAL time,
   works correctly regardless of whether geolocation is used.
   Uses the NOAA solar calculator algorithm (accurate ±1min). */
function calcSun(lat, lon, date) {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Julian day
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n  = JD - 2451545.0;

  // Mean longitude & anomaly (degrees)
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;

  // Ecliptic longitude
  const lambda = L + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);

  // Obliquity & declination
  const epsilon = 23.439 - 0.0000004 * n;
  const sinDec  = Math.sin(epsilon * rad) * Math.sin(lambda * rad);
  const decl    = Math.asin(sinDec) * deg;

  // Right ascension
  const RA = Math.atan2(
    Math.cos(epsilon * rad) * Math.sin(lambda * rad),
    Math.cos(lambda * rad)
  ) * deg;

  // Equation of time (minutes)
  const LL  = (L - RA + 180) % 360 - 180; // noon correction
  const EqT = -LL * 4; // approx eq of time in minutes

  // Hour angle for sunrise/sunset (sun centre at horizon −0.833°)
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad))
             / (Math.cos(lat * rad) * Math.cos(decl * rad));

  // Polar cases
  if (cosH >  1) return { sunrise: null, sunset: null, polar: 'night' };
  if (cosH < -1) return { sunrise: null, sunset: null, polar: 'day'   };

  const H = Math.acos(cosH) * deg; // degrees

  // UTC time of event (hours)
  // Solar noon UTC = 12 − EqT/60 − lon/15
  const solarNoonUTC = 12 - EqT / 60 - lon / 15;
  const sunriseUTC   = solarNoonUTC - H / 15;
  const sunsetUTC    = solarNoonUTC + H / 15;

  // Convert UTC → local wall-clock hours using actual browser TZ offset
  const tzOffsetHours = -date.getTimezoneOffset() / 60;
  const sunrise = ((sunriseUTC + tzOffsetHours) % 24 + 24) % 24;
  const sunset  = ((sunsetUTC  + tzOffsetHours) % 24 + 24) % 24;

  return { sunrise, sunset, polar: null };
}

function moonPhase(date) {
  const known = new Date(2000,0,6);
  const diff  = (date - known) / (1000*60*60*24);
  const cycle = 29.53058867;
  const phase = ((diff % cycle) + cycle) % cycle;
  const pct   = phase / cycle;
  const phases = [
    {name:'New Moon',       icon:'🌑', range:[0,     0.033]},
    {name:'Waxing Crescent',icon:'🌒', range:[0.033, 0.25 ]},
    {name:'First Quarter',  icon:'🌓', range:[0.25,  0.283]},
    {name:'Waxing Gibbous', icon:'🌔', range:[0.283, 0.5  ]},
    {name:'Full Moon',      icon:'🌕', range:[0.5,   0.533]},
    {name:'Waning Gibbous', icon:'🌖', range:[0.533, 0.75 ]},
    {name:'Last Quarter',   icon:'🌗', range:[0.75,  0.783]},
    {name:'Waning Crescent',icon:'🌘', range:[0.783, 1    ]},
  ];
  const p = phases.find(x => pct >= x.range[0] && pct < x.range[1]) || phases[0];
  return { ...p, pct: Math.round(pct * 100) };
}

/* Fallback coords derived from the browser's IANA timezone string.
   Covers every timezone so we always have a reasonable lat/lon
   even when geolocation is denied. */
const TZ_COORDS = {
  'Pacific/Honolulu':      [21.31,  -157.86],
  'America/Anchorage':     [61.22,  -149.90],
  'America/Los_Angeles':   [34.05,  -118.24],
  'America/Denver':        [39.74,  -104.99],
  'America/Chicago':       [41.85,   -87.65],
  'America/New_York':      [40.71,   -74.01],
  'America/Halifax':       [44.65,   -63.60],
  'America/St_Johns':      [47.56,   -52.71],
  'America/Sao_Paulo':     [-23.55,  -46.63],
  'America/Buenos_Aires':  [-34.60,  -58.38],
  'America/Mexico_City':   [19.43,   -99.13],
  'America/Bogota':        [4.71,    -74.07],
  'America/Lima':          [-12.04,  -77.03],
  'America/Toronto':       [43.65,   -79.38],
  'America/Vancouver':     [49.25,  -123.12],
  'Europe/London':         [51.51,    -0.13],
  'Europe/Dublin':         [53.33,    -6.25],
  'Europe/Lisbon':         [38.72,    -9.14],
  'Europe/Madrid':         [40.42,    -3.70],
  'Europe/Paris':          [48.85,     2.35],
  'Europe/Berlin':         [52.52,    13.41],
  'Europe/Rome':           [41.90,    12.50],
  'Europe/Amsterdam':      [52.37,     4.90],
  'Europe/Brussels':       [50.85,     4.35],
  'Europe/Vienna':         [48.21,    16.37],
  'Europe/Warsaw':         [52.23,    21.01],
  'Europe/Stockholm':      [59.33,    18.07],
  'Europe/Oslo':           [59.91,    10.75],
  'Europe/Copenhagen':     [55.68,    12.57],
  'Europe/Helsinki':       [60.17,    24.94],
  'Europe/Athens':         [37.98,    23.73],
  'Europe/Bucharest':      [44.43,    26.10],
  'Europe/Budapest':       [47.50,    19.04],
  'Europe/Prague':         [50.08,    14.44],
  'Europe/Kiev':           [50.45,    30.52],
  'Europe/Moscow':         [55.75,    37.62],
  'Africa/Cairo':          [30.04,    31.24],
  'Africa/Johannesburg':   [-26.20,   28.04],
  'Africa/Lagos':          [6.45,      3.39],
  'Africa/Nairobi':        [-1.29,    36.82],
  'Africa/Casablanca':     [33.59,    -7.62],
  'Asia/Dubai':            [25.20,    55.27],
  'Asia/Riyadh':           [24.69,    46.72],
  'Asia/Karachi':          [24.86,    67.01],
  'Asia/Kolkata':          [28.64,    77.22],
  'Asia/Colombo':          [6.93,     79.86],
  'Asia/Dhaka':            [23.72,    90.41],
  'Asia/Yangon':           [16.87,    96.19],
  'Asia/Bangkok':          [13.75,   100.52],
  'Asia/Jakarta':          [-6.21,   106.85],
  'Asia/Singapore':        [1.35,    103.82],
  'Asia/Kuala_Lumpur':     [3.14,    101.69],
  'Asia/Manila':           [14.60,   120.98],
  'Asia/Hong_Kong':        [22.32,   114.17],
  'Asia/Taipei':           [25.05,   121.53],
  'Asia/Shanghai':         [31.23,   121.47],
  'Asia/Tokyo':            [35.68,   139.69],
  'Asia/Seoul':            [37.57,   126.98],
  'Asia/Vladivostok':      [43.12,   131.89],
  'Asia/Tehran':           [35.69,    51.42],
  'Asia/Jerusalem':        [31.77,    35.22],
  'Asia/Istanbul':         [41.01,    28.95],
  'Asia/Beirut':           [33.89,    35.50],
  'Asia/Kabul':            [34.53,    69.17],
  'Asia/Tashkent':         [41.30,    69.27],
  'Asia/Almaty':           [43.25,    76.95],
  'Asia/Novosibirsk':      [54.99,    82.90],
  'Asia/Yekaterinburg':    [56.84,    60.61],
  'Australia/Perth':       [-31.95,  115.86],
  'Australia/Adelaide':    [-34.93,  138.60],
  'Australia/Darwin':      [-12.46,  130.84],
  'Australia/Brisbane':    [-27.47,  153.02],
  'Australia/Sydney':      [-33.87,  151.21],
  'Australia/Melbourne':   [-37.81,  144.96],
  'Pacific/Auckland':      [-36.87,  174.77],
  'Pacific/Fiji':          [-18.14,  178.44],
};

/* Legacy / alias timezone name mappings → canonical name in TZ_COORDS */
const TZ_ALIASES = {
  // India — browsers may report any of these
  'Asia/Calcutta':         'Asia/Kolkata',
  'Asia/Kolkata':          'Asia/Kolkata',
  'India/India':           'Asia/Kolkata',
  // Other common legacy names
  'Asia/Saigon':           'Asia/Bangkok',
  'Asia/Rangoon':          'Asia/Yangon',
  'Asia/Katmandu':         'Asia/Kolkata',   // close enough (+5:45 vs +5:30)
  'Asia/Dacca':            'Asia/Dhaka',
  'Asia/Ujung_Pandang':    'Asia/Jakarta',
  'Asia/Macao':            'Asia/Shanghai',
  'Asia/Chongqing':        'Asia/Shanghai',
  'Asia/Harbin':           'Asia/Shanghai',
  'Asia/Kashgar':          'Asia/Shanghai',
  'Asia/Urumqi':           'Asia/Shanghai',
  'Asia/Ulan_Bator':       'Asia/Shanghai',
  'Asia/Thimphu':          'Asia/Dhaka',
  'Asia/Muscat':           'Asia/Dubai',
  'Asia/Bahrain':          'Asia/Riyadh',
  'Asia/Kuwait':           'Asia/Riyadh',
  'Asia/Aden':             'Asia/Riyadh',
  'Asia/Phnom_Penh':       'Asia/Bangkok',
  'Asia/Vientiane':        'Asia/Bangkok',
  'Asia/Brunei':           'Asia/Singapore',
  'Asia/Kuching':          'Asia/Singapore',
  'Asia/Pontianak':        'Asia/Singapore',
  'Asia/Makassar':         'Asia/Singapore',
  'Asia/Dili':             'Asia/Tokyo',
  'Asia/Pyongyang':        'Asia/Seoul',
  'Asia/Macau':            'Asia/Hong_Kong',
  'Asia/Tel_Aviv':         'Asia/Jerusalem',
  'Asia/Nicosia':          'Asia/Beirut',
  'Asia/Tbilisi':          'Asia/Dubai',
  'Asia/Yerevan':          'Asia/Dubai',
  'Asia/Baku':             'Asia/Dubai',
  'Asia/Ashgabat':         'Asia/Tashkent',
  'Asia/Ashkhabad':        'Asia/Tashkent',
  'Asia/Bishkek':          'Asia/Tashkent',
  'Asia/Dushanbe':         'Asia/Tashkent',
  'Asia/Samarkand':        'Asia/Tashkent',
  'Asia/Irkutsk':          'Asia/Shanghai',
  'Asia/Krasnoyarsk':      'Asia/Novosibirsk',
  'Asia/Omsk':             'Asia/Novosibirsk',
  'Asia/Yakutsk':          'Asia/Tokyo',
  'Asia/Magadan':          'Asia/Vladivostok',
  'Asia/Kamchatka':        'Asia/Vladivostok',
  'Asia/Anadyr':           'Asia/Vladivostok',
  'Europe/Kyiv':           'Europe/Kiev',
  'Europe/Uzhgorod':       'Europe/Kiev',
  'Europe/Zaporozhye':     'Europe/Kiev',
  'Europe/Minsk':          'Europe/Moscow',
  'Europe/Kaliningrad':    'Europe/Warsaw',
  'Europe/Samara':         'Europe/Moscow',
  'Europe/Simferopol':     'Europe/Moscow',
  'Europe/Volgograd':      'Europe/Moscow',
  'Europe/Zurich':         'Europe/Berlin',
  'Europe/Luxembourg':     'Europe/Paris',
  'Europe/Monaco':         'Europe/Paris',
  'Europe/Andorra':        'Europe/Madrid',
  'Europe/Gibraltar':      'Europe/Madrid',
  'Europe/Malta':          'Europe/Rome',
  'Europe/San_Marino':     'Europe/Rome',
  'Europe/Vatican':        'Europe/Rome',
  'Europe/Tirane':         'Europe/Rome',
  'Europe/Podgorica':      'Europe/Belgrade',
  'Europe/Belgrade':       'Europe/Rome',
  'Europe/Ljubljana':      'Europe/Rome',
  'Europe/Sarajevo':       'Europe/Rome',
  'Europe/Skopje':         'Europe/Rome',
  'Europe/Zagreb':         'Europe/Rome',
  'Europe/Sofia':          'Europe/Athens',
  'Europe/Tallinn':        'Europe/Helsinki',
  'Europe/Riga':           'Europe/Helsinki',
  'Europe/Vilnius':        'Europe/Helsinki',
  'Europe/Mariehamn':      'Europe/Helsinki',
  'Europe/Nicosia':        'Asia/Beirut',
  'Europe/Chisinau':       'Europe/Bucharest',
  'Europe/Tiraspol':       'Europe/Bucharest',
  'Europe/Ulyanovsk':      'Europe/Moscow',
  'Atlantic/Reykjavik':    'Europe/London',
  'Atlantic/Faroe':        'Europe/London',
  'Atlantic/Canary':       'Europe/London',
  'Africa/Abidjan':        'Africa/Lagos',
  'Africa/Accra':          'Africa/Lagos',
  'Africa/Bamako':         'Africa/Lagos',
  'Africa/Banjul':         'Africa/Lagos',
  'Africa/Conakry':        'Africa/Lagos',
  'Africa/Dakar':          'Africa/Lagos',
  'Africa/Freetown':       'Africa/Lagos',
  'Africa/Lome':           'Africa/Lagos',
  'Africa/Monrovia':       'Africa/Lagos',
  'Africa/Nouakchott':     'Africa/Lagos',
  'Africa/Ouagadougou':    'Africa/Lagos',
  'Africa/Sao_Tome':       'Africa/Lagos',
  'Africa/Tripoli':        'Africa/Cairo',
  'Africa/Tunis':          'Africa/Cairo',
  'Africa/Algiers':        'Africa/Cairo',
  'Africa/Khartoum':       'Africa/Nairobi',
  'Africa/Addis_Ababa':    'Africa/Nairobi',
  'Africa/Asmara':         'Africa/Nairobi',
  'Africa/Dar_es_Salaam':  'Africa/Nairobi',
  'Africa/Djibouti':       'Africa/Nairobi',
  'Africa/Kampala':        'Africa/Nairobi',
  'Africa/Mogadishu':      'Africa/Nairobi',
  'Africa/Blantyre':       'Africa/Johannesburg',
  'Africa/Bujumbura':      'Africa/Johannesburg',
  'Africa/Gaborone':       'Africa/Johannesburg',
  'Africa/Harare':         'Africa/Johannesburg',
  'Africa/Kigali':         'Africa/Johannesburg',
  'Africa/Lubumbashi':     'Africa/Johannesburg',
  'Africa/Lusaka':         'Africa/Johannesburg',
  'Africa/Maputo':         'Africa/Johannesburg',
  'Africa/Maseru':         'Africa/Johannesburg',
  'Africa/Mbabane':        'Africa/Johannesburg',
  'Africa/Windhoek':       'Africa/Johannesburg',
  'Australia/Lord_Howe':   'Australia/Sydney',
  'Australia/Hobart':      'Australia/Sydney',
  'Australia/Currie':      'Australia/Sydney',
  'Australia/Canberra':    'Australia/Sydney',
  'Australia/ACT':         'Australia/Sydney',
  'Australia/NSW':         'Australia/Sydney',
  'Australia/Victoria':    'Australia/Melbourne',
  'Australia/Queensland':  'Australia/Brisbane',
  'Australia/Lindeman':    'Australia/Brisbane',
  'Australia/South':       'Australia/Adelaide',
  'Australia/North':       'Australia/Darwin',
  'Australia/West':        'Australia/Perth',
  'Australia/Broken_Hill': 'Australia/Adelaide',
  'Australia/Eucla':       'Australia/Perth',
  'Australia/LHI':         'Australia/Sydney',
  'Pacific/Port_Moresby':  'Australia/Brisbane',
  'Pacific/Guam':          'Asia/Tokyo',
  'Pacific/Saipan':        'Asia/Tokyo',
  'Pacific/Pohnpei':       'Asia/Tokyo',
  'Pacific/Truk':          'Asia/Tokyo',
  'Pacific/Palau':         'Asia/Manila',
  'Pacific/Tongatapu':     'Pacific/Auckland',
  'Pacific/Apia':          'Pacific/Auckland',
  'Pacific/Fakaofo':       'Pacific/Auckland',
  'US/Eastern':            'America/New_York',
  'US/Central':            'America/Chicago',
  'US/Mountain':           'America/Denver',
  'US/Pacific':            'America/Los_Angeles',
  'US/Hawaii':             'Pacific/Honolulu',
  'US/Alaska':             'America/Anchorage',
  'Canada/Eastern':        'America/Toronto',
  'Canada/Central':        'America/Chicago',
  'Canada/Pacific':        'America/Vancouver',
  'Brazil/East':           'America/Sao_Paulo',
  'Brazil/West':           'America/Bogota',
  'Mexico/General':        'America/Mexico_City',
  'GMT':                   'Europe/London',
  'UTC':                   'Europe/London',
};

function getCoordsFromTz() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 1. Exact match in main table
  if (TZ_COORDS[tz]) return TZ_COORDS[tz];

  // 2. Alias lookup → then exact match in main table
  const canonical = TZ_ALIASES[tz];
  if (canonical && TZ_COORDS[canonical]) return TZ_COORDS[canonical];

  // 3. Case-insensitive exact match (some browsers)
  const tzLower = tz.toLowerCase();
  for (const [k, v] of Object.entries(TZ_COORDS)) {
    if (k.toLowerCase() === tzLower) return v;
  }

  // 4. Match by UTC offset — find entry whose longitude matches offset best
  //    Use actual timezone offset in hours (handles fractional offsets like +5:30)
  const offsetH = -new Date().getTimezoneOffset() / 60; // e.g. 5.5 for IST
  let bestKey = null, bestDiff = Infinity;
  for (const [k, [lat, lon]] of Object.entries(TZ_COORDS)) {
    // Convert longitude to approximate UTC offset
    const approxOffset = lon / 15;
    const diff = Math.abs(approxOffset - offsetH);
    if (diff < bestDiff) { bestDiff = diff; bestKey = k; }
  }
  return TZ_COORDS[bestKey];
}

let userLat = null, userLon = null, geoSource = 'tz';

function initGeolocation() {
  // First, immediately set coords from TZ fallback so sun shows right away
  const tzCoords = getCoordsFromTz();
  userLat = tzCoords[0];
  userLon = tzCoords[1];
  geoSource = 'tz';
  updateSun();

  // Then try to get real GPS — if granted, upgrade seamlessly
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        geoSource = 'gps';
        updateSun(); // refresh with precise location
      },
      () => {
        // Denied or unavailable — already showing TZ-based estimate, nothing to do
        geoSource = 'tz';
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }
}

function fmtHr(hr) {
  if (hr === null || hr === undefined) return '—';
  hr = ((hr % 24) + 24) % 24;
  const h = Math.floor(hr);
  let m = Math.round((hr - h) * 60);
  // Handle rounding overflow
  const hh = m >= 60 ? h + 1 : h;
  const mm = m >= 60 ? 0 : m;
  if (is24h) return `${String(hh % 24).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  const ampm = hh % 24 >= 12 ? 'PM' : 'AM';
  const dh = hh % 12 || 12;
  return `${dh}:${String(mm).padStart(2,'0')} ${ampm}`;
}

function updateSun() {
  const now    = new Date();
  const sun    = calcSun(userLat, userLon, now);
  const nowHr  = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  if (sun.polar === 'day') {
    document.getElementById('sunrise-val').textContent = 'Midnight sun';
    document.getElementById('sunset-val').textContent  = 'No sunset';
    document.getElementById('daylight-val').textContent = '24h';
    document.getElementById('sunrise-sub').textContent = '';
    document.getElementById('sunset-sub').textContent  = '';
  } else if (sun.polar === 'night') {
    document.getElementById('sunrise-val').textContent = 'Polar night';
    document.getElementById('sunset-val').textContent  = 'No sunrise';
    document.getElementById('daylight-val').textContent = '0h';
    document.getElementById('sunrise-sub').textContent = '';
    document.getElementById('sunset-sub').textContent  = '';
  } else {
    document.getElementById('sunrise-val').textContent = fmtHr(sun.sunrise);
    document.getElementById('sunset-val').textContent  = fmtHr(sun.sunset);
    const dl = sun.sunset - sun.sunrise;
    document.getElementById('daylight-val').textContent = Math.max(0, dl).toFixed(1) + 'h';

    // Subtext: time until / since — handle wrap-around midnight correctly
    const minsToSunrise = Math.round(((sun.sunrise - nowHr + 24) % 24) * 60);
    const minsToSunset  = Math.round(((sun.sunset  - nowHr + 24) % 24) * 60);
    // "Already risen" if sun rose less than ~12h ago and hasn't set yet
    const sunrisePassedToday = nowHr >= sun.sunrise;
    const sunsetPassedToday  = nowHr >= sun.sunset;
    document.getElementById('sunrise-sub').textContent =
      sunrisePassedToday ? 'Already risen' : `in ${minsToSunrise}min`;
    document.getElementById('sunset-sub').textContent =
      sunsetPassedToday  ? 'Already set'   : `in ${minsToSunset}min`;
  }

  // Location badge — show timezone abbreviation
  const resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const tzName = resolvedTz.replace(/_/g,' ');
  // Look up abbreviation from our search DB
  const tzEntry = (typeof TZ_SEARCH_DB !== 'undefined')
    ? TZ_SEARCH_DB.find(e => e.tz === resolvedTz)
    : null;
  const tzAbbr = tzEntry ? tzEntry.abbr : getOffset(resolvedTz);
  document.getElementById('tz-label').textContent = geoSource === 'gps'
    ? `${tzName} · ${tzAbbr} · 📍 GPS`
    : `${tzName} · ${tzAbbr} · 📌 approx`;
  // Hero clock timezone badge
  const heroBadge = document.getElementById('hero-tz-badge');
  if (heroBadge) heroBadge.textContent = tzAbbr;

  // Source label on sunrise/sunset cells
  const srcNote = geoSource === 'gps' ? '' : ' (approx)';
  document.getElementById('sunrise-sub2') && (document.getElementById('sunrise-sub2').textContent = srcNote);

  // Moon
  const moon = moonPhase(now);
  document.getElementById('moon-icon').textContent  = moon.icon;
  document.getElementById('moon-phase').textContent = moon.name;
  document.getElementById('moon-pct').textContent   = `${moon.pct}% of cycle`;
}

// Kick off — shows TZ estimate immediately, upgrades to GPS if permitted
initGeolocation();

// ═══════════════════════════════════════════════════
//  HOLIDAYS (REGION-AWARE)
// ═══════════════════════════════════════════════════
// Holiday logic has been extracted to /js/holidays.js for modularity.
// Exposed globals used across this file: getHolidays, updateHolidays, inferHolidayRegion.

// ═══════════════════════════════════════════════════
//  MAIN TICK
// ═══════════════════════════════════════════════════
function tick() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  updateAnalog(h, m, s);

  // Digital display
  let dh = h; const ampm = h >= 12 ? 'PM' : 'AM';
  if (!is24h) dh = h%12||12;
  document.getElementById('dh').textContent = pad(dh);
  document.getElementById('dm').textContent = pad(m);
  document.getElementById('ds').textContent = pad(s);
  document.getElementById('ampm-tag').style.display = is24h ? 'none' : 'block';
  document.getElementById('ampm-tag').textContent = ampm;

  // Date
  const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS= ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('d-weekday').textContent = DAYS[now.getDay()];
  document.getElementById('d-full').textContent = `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  const wk  = getWeek(now);
  const doy = getDoy(now);
  const diy = daysInYear(now.getFullYear());
  document.getElementById('d-week').textContent = wk;
  document.getElementById('d-doy').textContent  = doy;
  document.getElementById('d-diy').textContent  = diy;
  // Don't overwrite tz-label here — updateSun owns it with GPS/TZ source info

  // Year bar
  const pct = (doy/diy*100);
  document.getElementById('yr-bar').style.width = pct+'%';
  document.getElementById('yr-pct-label').textContent = pct.toFixed(2)+'%';

  // Stats
  document.getElementById('s-doy').textContent  = doy;
  document.getElementById('s-doy-pct').textContent = `${((doy/diy)*100).toFixed(1)}% of year`;
  document.getElementById('s-week').textContent = wk;

  const offMin = -now.getTimezoneOffset();
  const oh = Math.floor(Math.abs(offMin)/60), om = Math.abs(offMin)%60;
  document.getElementById('s-offset').textContent = `UTC${offMin>=0?'+':'-'}${pad(oh)}:${pad(om)}`;

  // DST
  const jan = new Date(now.getFullYear(),0,1).getTimezoneOffset();
  const jul = new Date(now.getFullYear(),6,1).getTimezoneOffset();
  const dst = now.getTimezoneOffset() < Math.max(jan,jul);
  document.getElementById('s-dst').textContent = `DST: ${dst?'Active':'Inactive'}`;

  // Epoch day
  const epochDay = Math.floor(now.getTime()/(86400*1000));
  document.getElementById('s-utc-diff').textContent = `${offMin>=0?'+':'-'}${pad(oh)}h${om?pad(om)+'m':''}`;
  document.getElementById('s-epoch-day').textContent = `Epoch day ${epochDay.toLocaleString()}`;

  // Mono strip
  document.getElementById('unix-val').textContent = Math.floor(now.getTime()/1000);
  document.getElementById('iso-val').textContent  = now.toISOString().slice(0,19)+'Z';
  document.getElementById('rfc-val').textContent  = now.toUTCString();

  // World clocks
  updateWorldClocks(now);

  // TZ result card
  if (selectedTz) updateTzCard(selectedTz, now);

  // Alarms
  checkAlarms(now);
}

// ═══════════════════════════════════════════════════
//  WORLD CLOCKS
// ═══════════════════════════════════════════════════
function renderWorldClocks() {
  const grid = document.getElementById('clocks-grid');
  grid.innerHTML = '';
  worldClocks.forEach((item,i) => {
    const div = document.createElement('div');
    div.className = 'clock-card';
    div.id = 'wc-'+i;
    div.innerHTML = `
      <div class="clock-card-header">
        <div class="cc-city">${item.city}</div>
        <div class="cc-status" id="wcs-${i}">—</div>
      </div>
      <div class="cc-time" id="wct-${i}">--:--:--</div>
      <div class="cc-bottom">
        <div class="cc-date" id="wcd-${i}">—</div>
        <div class="cc-offset">${getOffset(item.tz)}</div>
      </div>
      <button class="cc-remove" onclick="removeCity(${i})" title="Remove">✕</button>`;
    grid.appendChild(div);
  });
  // Add button
  const add = document.createElement('div');
  add.className = 'add-city-card';
  add.innerHTML = `<span>+</span><span>Add City</span>`;
  add.onclick = () => { document.getElementById('tz-search').focus(); document.getElementById('tz-search').scrollIntoView({behavior:'smooth'}); };
  grid.appendChild(add);
}

function updateWorldClocks(now) {
  const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  worldClocks.forEach((item,i) => {
    const card = document.getElementById('wc-'+i);
    const timeEl = document.getElementById('wct-'+i);
    const dateEl = document.getElementById('wcd-'+i);
    const statEl = document.getElementById('wcs-'+i);
    if (!card || !timeEl) return;

    const tzDate = new Date(now.toLocaleString('en-US',{timeZone:item.tz}));
    let wh = tzDate.getHours(), wm = tzDate.getMinutes(), ws = tzDate.getSeconds();
    const wAmpm = wh>=12?'PM':'AM';
    if(!is24h) wh = wh%12||12;
    timeEl.textContent = `${pad(wh)}:${pad(wm)}:${pad(ws)}${is24h?'':' '+wAmpm}`;
    dateEl.textContent = `${MNAMES[tzDate.getMonth()]} ${tzDate.getDate()}`;

    // Business hours 9-17 Mon-Fri
    const bizH = new Date(now.toLocaleString('en-US',{timeZone:item.tz})).getHours();
    const bizD = new Date(now.toLocaleString('en-US',{timeZone:item.tz})).getDay();
    const isWeekday = bizD>=1&&bizD<=5;
    card.classList.remove('biz-open','biz-soon','biz-closed');
    if (isWeekday && bizH>=9 && bizH<17) {
      card.classList.add('biz-open'); statEl.textContent='OPEN';
    } else if (isWeekday && ((bizH>=8&&bizH<9)||(bizH>=17&&bizH<18))) {
      card.classList.add('biz-soon'); statEl.textContent='SOON';
    } else {
      card.classList.add('biz-closed'); statEl.textContent='CLOSED';
    }
  });
}

function removeCity(i) {
  worldClocks.splice(i,1);
  localStorage.setItem('worldClocks', JSON.stringify(worldClocks));
  renderWorldClocks();
}

// ═══════════════════════════════════════════════════
//  TZ SEARCH
// ═══════════════════════════════════════════════════
const tzSearch = document.getElementById('tz-search');
const tzResults = document.getElementById('tz-results');
let tzSelectedIdx = -1;

tzSearch.addEventListener('input', () => {
  const q = tzSearch.value.trim();
  tzSelectedIdx = -1;
  if (!q) { tzResults.classList.remove('open'); return; }
  const matches = tzElasticSearch(q);
  renderTzResults(matches, tzResults, 'selectTz');
});

tzSearch.addEventListener('keydown', e => {
  const items = tzResults.querySelectorAll('.tz-item:not(.tz-no-result)');
  if (e.key === 'ArrowDown') { e.preventDefault(); tzSelectedIdx = Math.min(tzSelectedIdx+1, items.length-1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); tzSelectedIdx = Math.max(tzSelectedIdx-1, 0); }
  else if (e.key === 'Enter' && tzSelectedIdx >= 0) { items[tzSelectedIdx]?.click(); return; }
  else if (e.key === 'Escape') { tzResults.classList.remove('open'); return; }
  items.forEach((el,i) => el.classList.toggle('tz-item-active', i === tzSelectedIdx));
});

document.addEventListener('click', e => {
  if (!e.target.closest('.tz-search-wrap')) tzResults.classList.remove('open');
});

function selectTz(tz, label, abbr) {
  selectedTz = tz;
  // Show friendly label in input
  tzSearch.value = label || tz.replace(/_/g,' ');
  tzResults.classList.remove('open');
  document.getElementById('tz-result-card').style.display = 'block';
  updateTzCard(tz, new Date(), label, abbr);

  // Add to world clocks
  if (!worldClocks.find(c=>c.tz===tz)) {
    const city = label || tz.split('/').pop().replace(/_/g,' ');
    worldClocks.push({city, tz});
    localStorage.setItem('worldClocks', JSON.stringify(worldClocks));
    renderWorldClocks();
  }
}

function updateTzCard(tz, now, label, abbr) {
  const MNAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DNAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const tzDate = new Date(now.toLocaleString('en-US',{timeZone:tz}));
  let h = tzDate.getHours(), m = tzDate.getMinutes(), s = tzDate.getSeconds();
  const ampm = h>=12?'PM':'AM';
  if (!is24h) h = h%12||12;
  const displayName = label || tz.replace(/_/g,' ');
  const utcOffset = getOffset(tz);
  // Only show abbr if it's meaningfully different from the UTC offset
  const displayAbbr = (abbr && abbr !== utcOffset && !abbr.startsWith('UTC')) ? abbr : '';
  document.getElementById('tzrc-name').textContent = displayName;
  document.getElementById('tzrc-time').textContent = `${pad(h)}:${pad(m)}:${pad(s)}${is24h?'':' '+ampm}`;
  document.getElementById('tzrc-date').textContent = `${DNAMES[tzDate.getDay()]}, ${MNAMES[tzDate.getMonth()]} ${tzDate.getDate()}, ${tzDate.getFullYear()}`;
  document.getElementById('tzrc-offset').textContent = displayAbbr ? `${utcOffset} · ${displayAbbr}` : utcOffset;

  // Correctly compute difference in total minutes between `tz` and local
  const localOffMins  = -now.getTimezoneOffset();                    // local UTC offset in mins
  const targetOffMins = getTimezoneOffsetMins(tz, now);              // target UTC offset in mins
  const diffMins = targetOffMins - localOffMins;

  if (diffMins === 0) {
    document.getElementById('tzrc-diff').textContent = 'Same as your time';
  } else {
    const sign     = diffMins > 0 ? '+' : '-';
    const absMins  = Math.abs(diffMins);
    const dh       = Math.floor(absMins / 60);
    const dm       = absMins % 60;
    const label    = dh > 0 ? `${dh}h${dm ? ' '+dm+'m' : ''}` : `${dm}m`;
    const dir      = diffMins > 0 ? 'ahead' : 'behind';
    document.getElementById('tzrc-diff').textContent = `${sign}${label} ${dir}`;
  }
}

// Stopwatch/Timer moved to /js/features/stopwatch-timer.js

// Calendar moved to /js/features/calendar.js

// Converter moved to /js/features/converter.js

// Alarms moved to /js/features/alarms.js

// Tasks moved to /js/features/tasks.js

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
renderWorldClocks();
renderCalendar();
convInit();
renderAlarms();
updateHolidays();
tick();
setInterval(tick, 1000);
setInterval(updateSun, 60000);

// Sidebar logic moved to /js/ui/sidebar.js


// Initialize UI modules
initSidebarUI();
initThemeUI();
