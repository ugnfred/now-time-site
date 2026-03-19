(function () {
  // ── Country detection from IANA timezone ──────────
  const TZ_TO_COUNTRY = {
    'Asia/Kolkata':'IN','Asia/Calcutta':'IN',
    'America/New_York':'US','America/Chicago':'US','America/Denver':'US',
    'America/Los_Angeles':'US','America/Phoenix':'US','America/Anchorage':'US',
    'Pacific/Honolulu':'US','America/Indiana/Indianapolis':'US',
    'America/Detroit':'US','America/Kentucky/Louisville':'US',
    'America/Boise':'US','America/Juneau':'US','America/Nome':'US',
    'Europe/London':'GB','Europe/Belfast':'GB',
    'Europe/Paris':'FR','Europe/Berlin':'DE','Europe/Madrid':'ES',
    'Europe/Rome':'IT','Europe/Amsterdam':'NL','Europe/Brussels':'BE',
    'Europe/Zurich':'CH','Europe/Vienna':'AT','Europe/Stockholm':'SE',
    'Europe/Oslo':'NO','Europe/Copenhagen':'DK','Europe/Helsinki':'FI',
    'Europe/Athens':'GR','Europe/Lisbon':'PT','Europe/Warsaw':'PL',
    'Europe/Budapest':'HU','Europe/Prague':'CZ','Europe/Bucharest':'RO',
    'Europe/Kiev':'UA','Europe/Moscow':'RU','Europe/Istanbul':'TR',
    'Europe/Dublin':'IE',
    'Asia/Dubai':'AE','Asia/Riyadh':'SA','Asia/Qatar':'QA',
    'Asia/Kuwait':'KW','Asia/Jerusalem':'IL','Asia/Tehran':'IR',
    'Asia/Karachi':'PK','Asia/Dhaka':'BD','Asia/Colombo':'LK',
    'Asia/Kathmandu':'NP','Asia/Singapore':'SG','Asia/Kuala_Lumpur':'MY',
    'Asia/Bangkok':'TH','Asia/Ho_Chi_Minh':'VN','Asia/Jakarta':'ID',
    'Asia/Manila':'PH','Asia/Shanghai':'CN','Asia/Hong_Kong':'HK',
    'Asia/Taipei':'TW','Asia/Tokyo':'JP','Asia/Seoul':'KR',
    'Asia/Yangon':'MM','Asia/Kabul':'AF','Asia/Tashkent':'UZ',
    'Australia/Sydney':'AU','Australia/Melbourne':'AU','Australia/Brisbane':'AU',
    'Australia/Perth':'AU','Australia/Adelaide':'AU','Australia/Darwin':'AU',
    'Pacific/Auckland':'NZ','Pacific/Fiji':'FJ','Pacific/Honolulu':'US',
    'America/Toronto':'CA','America/Vancouver':'CA','America/Edmonton':'CA',
    'America/Winnipeg':'CA','America/Halifax':'CA',
    'Africa/Johannesburg':'ZA','Africa/Lagos':'NG','Africa/Nairobi':'KE',
    'Africa/Cairo':'EG','Africa/Accra':'GH','Africa/Addis_Ababa':'ET',
    'Africa/Casablanca':'MA','Africa/Dar_es_Salaam':'TZ',
    'America/Sao_Paulo':'BR','America/Argentina/Buenos_Aires':'AR',
    'America/Mexico_City':'MX','America/Bogota':'CO','America/Lima':'PE',
    'America/Santiago':'CL','America/Caracas':'VE',
  };

  const COUNTRY_NAMES = {
    IN:'India', US:'United States', GB:'United Kingdom', AU:'Australia',
    CA:'Canada', JP:'Japan', DE:'Germany', FR:'France', AE:'UAE',
    SG:'Singapore', ZA:'South Africa', NG:'Nigeria', KE:'Kenya',
    BR:'Brazil', PK:'Pakistan', NZ:'New Zealand', CN:'China', KR:'South Korea',
    RU:'Russia', TR:'Turkey', MX:'Mexico', AR:'Argentina', IT:'Italy',
    ES:'Spain', NL:'Netherlands', SE:'Sweden', NO:'Norway', DK:'Denmark',
    FI:'Finland', GR:'Greece', PT:'Portugal', BE:'Belgium', AT:'Austria',
    CH:'Switzerland', PL:'Poland', RO:'Romania', CZ:'Czech Republic',
    HU:'Hungary', UA:'Ukraine', IE:'Ireland', IL:'Israel', SA:'Saudi Arabia',
    QA:'Qatar', KW:'Kuwait', IR:'Iran', BD:'Bangladesh', LK:'Sri Lanka',
    NP:'Nepal', MY:'Malaysia', TH:'Thailand', VN:'Vietnam', ID:'Indonesia',
    PH:'Philippines', HK:'Hong Kong', TW:'Taiwan', MM:'Myanmar',
    EG:'Egypt', GH:'Ghana', ET:'Ethiopia', MA:'Morocco', TZ:'Tanzania',
    CO:'Colombia', PE:'Peru', CL:'Chile', VE:'Venezuela', FJ:'Fiji',
  };

  function inferCountry() {
    const saved = localStorage.getItem('holidayCountry');
    if (saved) return saved;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz];
    // Fallback by prefix
    if (tz.startsWith('Asia/')) return 'IN';
    if (tz.startsWith('America/')) return 'US';
    if (tz.startsWith('Europe/')) return 'GB';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('Africa/')) return 'ZA';
    return 'US';
  }

  // ── Holiday calculation helpers ───────────────────
  function easter(y) {
    const f=Math.floor,a=y%19,b=f(y/100),c=y%100,d=f(b/4),e=b%4,
      g=f((8*b+13)/25),h=(19*a+b-d-g+15)%30,i=f(c/4),k=c%4,
      l=(32+2*e+2*i-h-k)%7,m=f((a+11*h+19*l)/433),
      n=f((h+l-7*m+90)/25),p=(h+l-7*m+33*n+19)%32;
    return new Date(y,n-1,p);
  }
  function nth(y,mo,dow,n) {
    const d=new Date(y,mo,1); let c=0;
    while(true){if(d.getDay()===dow)c++;if(c===n)return new Date(d);d.setDate(d.getDate()+1);}
  }
  function last(y,mo,dow) {
    const d=new Date(y,mo+1,0);
    while(d.getDay()!==dow)d.setDate(d.getDate()-1);
    return d;
  }
  function addDays(date,days) { const d=new Date(date);d.setDate(d.getDate()+days);return d; }

  // ── Holiday database by country ───────────────────
  const HOLIDAYS = {
    IN: y => [
      {name:'New Year\'s Day',        date:new Date(y,0,1)},
      {name:'Makar Sankranti',         date:new Date(y,0,14)},
      {name:'Republic Day',            date:new Date(y,0,26)},
      {name:'Maha Shivratri',          date:new Date(y,1,26)},
      {name:'Holi',                    date:new Date(y,2,14)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Ambedkar Jayanti',        date:new Date(y,3,14)},
      {name:'Ram Navami',              date:new Date(y,3,6)},
      {name:'Mahavir Jayanti',         date:new Date(y,3,10)},
      {name:'Buddha Purnima',          date:new Date(y,4,12)},
      {name:'Eid ul-Fitr',             date:new Date(y,2,31)},
      {name:'Eid ul-Adha',             date:new Date(y,5,17)},
      {name:'Independence Day',        date:new Date(y,7,15)},
      {name:'Janmashtami',             date:new Date(y,7,26)},
      {name:'Gandhi Jayanti',          date:new Date(y,9,2)},
      {name:'Navratri begins',         date:new Date(y,9,3)},
      {name:'Dussehra',                date:new Date(y,9,12)},
      {name:'Diwali',                  date:new Date(y,9,20)},
      {name:'Guru Nanak Jayanti',      date:new Date(y,10,5)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
    ],
    US: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Martin Luther King Jr.',  date:nth(y,0,1,3)},
      {name:'Presidents\' Day',        date:nth(y,1,1,3)},
      {name:'St. Patrick\'s Day',      date:new Date(y,2,17)},
      {name:'Easter Sunday',           date:easter(y)},
      {name:'Earth Day',               date:new Date(y,3,22)},
      {name:'Mother\'s Day',           date:nth(y,4,0,2)},
      {name:'Memorial Day',            date:last(y,4,1)},
      {name:'Juneteenth',              date:new Date(y,5,19)},
      {name:'Father\'s Day',           date:nth(y,5,0,3)},
      {name:'Independence Day',        date:new Date(y,6,4)},
      {name:'Labor Day',               date:nth(y,8,1,1)},
      {name:'Columbus Day',            date:nth(y,9,1,2)},
      {name:'Halloween',               date:new Date(y,9,31)},
      {name:'Veterans Day',            date:new Date(y,10,11)},
      {name:'Thanksgiving',            date:nth(y,10,4,4)},
      {name:'Christmas Eve',           date:new Date(y,11,24)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'New Year\'s Eve',         date:new Date(y,11,31)},
    ],
    GB: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Valentine\'s Day',        date:new Date(y,1,14)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Sunday',           date:easter(y)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Early May Bank Holiday',  date:nth(y,4,1,1)},
      {name:'Spring Bank Holiday',     date:last(y,4,1)},
      {name:'Summer Bank Holiday',     date:last(y,7,1)},
      {name:'Guy Fawkes Night',        date:new Date(y,10,5)},
      {name:'Remembrance Day',         date:new Date(y,10,11)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Boxing Day',              date:new Date(y,11,26)},
    ],
    AU: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Australia Day',           date:new Date(y,0,26)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Saturday',         date:addDays(easter(y),-1)},
      {name:'Easter Sunday',           date:easter(y)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Anzac Day',               date:new Date(y,3,25)},
      {name:'Queen\'s Birthday',       date:nth(y,5,1,2)},
      {name:'Labour Day',              date:nth(y,9,1,1)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Boxing Day',              date:new Date(y,11,26)},
    ],
    CA: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Family Day',              date:nth(y,1,1,3)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Victoria Day',            date:last(y,4,1)},
      {name:'Canada Day',              date:new Date(y,6,1)},
      {name:'Labour Day',              date:nth(y,8,1,1)},
      {name:'Thanksgiving',            date:nth(y,9,1,2)},
      {name:'Remembrance Day',         date:new Date(y,10,11)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Boxing Day',              date:new Date(y,11,26)},
    ],
    JP: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Coming of Age Day',       date:nth(y,0,1,2)},
      {name:'National Foundation Day', date:new Date(y,1,11)},
      {name:'Emperor\'s Birthday',     date:new Date(y,1,23)},
      {name:'Vernal Equinox Day',      date:new Date(y,2,20)},
      {name:'Showa Day',               date:new Date(y,3,29)},
      {name:'Constitution Day',        date:new Date(y,4,3)},
      {name:'Greenery Day',            date:new Date(y,4,4)},
      {name:'Children\'s Day',         date:new Date(y,4,5)},
      {name:'Marine Day',              date:nth(y,6,1,3)},
      {name:'Mountain Day',            date:new Date(y,7,11)},
      {name:'Respect for Aged Day',    date:nth(y,8,1,3)},
      {name:'Sports Day',              date:nth(y,9,1,2)},
      {name:'Culture Day',             date:new Date(y,10,3)},
      {name:'Labour Thanksgiving',     date:new Date(y,10,23)},
    ],
    DE: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Ascension Day',           date:addDays(easter(y),39)},
      {name:'Whit Monday',             date:addDays(easter(y),50)},
      {name:'German Unity Day',        date:new Date(y,9,3)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'2nd Day Christmas',       date:new Date(y,11,26)},
    ],
    FR: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Victory in Europe Day',   date:new Date(y,4,8)},
      {name:'Ascension Day',           date:addDays(easter(y),39)},
      {name:'Whit Monday',             date:addDays(easter(y),50)},
      {name:'Bastille Day',            date:new Date(y,6,14)},
      {name:'Assumption of Mary',      date:new Date(y,7,15)},
      {name:'All Saints\' Day',        date:new Date(y,10,1)},
      {name:'Armistice Day',           date:new Date(y,10,11)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
    ],
    AE: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Eid ul-Fitr',             date:new Date(y,2,31)},
      {name:'Eid ul-Adha',             date:new Date(y,5,17)},
      {name:'Islamic New Year',        date:new Date(y,6,7)},
      {name:'Prophet\'s Birthday',     date:new Date(y,8,5)},
      {name:'UAE National Day',        date:new Date(y,11,2)},
      {name:'UAE National Day',        date:new Date(y,11,3)},
    ],
    SG: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Chinese New Year',        date:new Date(y,1,10)},
      {name:'Chinese New Year 2',      date:new Date(y,1,11)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Hari Raya Puasa',         date:new Date(y,2,31)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Vesak Day',               date:new Date(y,4,12)},
      {name:'Hari Raya Haji',          date:new Date(y,5,17)},
      {name:'National Day',            date:new Date(y,7,9)},
      {name:'Deepavali',               date:new Date(y,9,20)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
    ],
    ZA: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Human Rights Day',        date:new Date(y,2,21)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Family Day',              date:addDays(easter(y),1)},
      {name:'Freedom Day',             date:new Date(y,3,27)},
      {name:'Workers\' Day',           date:new Date(y,4,1)},
      {name:'Youth Day',               date:new Date(y,5,16)},
      {name:'Women\'s Day',            date:new Date(y,7,9)},
      {name:'Heritage Day',            date:new Date(y,8,24)},
      {name:'Day of Reconciliation',   date:new Date(y,11,16)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Day of Goodwill',         date:new Date(y,11,26)},
    ],
    NG: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Workers\' Day',           date:new Date(y,4,1)},
      {name:'Democracy Day',           date:new Date(y,5,12)},
      {name:'Eid ul-Fitr',             date:new Date(y,2,31)},
      {name:'Eid ul-Adha',             date:new Date(y,5,17)},
      {name:'Independence Day',        date:new Date(y,9,1)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Boxing Day',              date:new Date(y,11,26)},
    ],
    KE: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Easter Monday',           date:addDays(easter(y),1)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Madaraka Day',            date:new Date(y,5,1)},
      {name:'Eid ul-Adha',             date:new Date(y,5,17)},
      {name:'Mashujaa Day',            date:new Date(y,9,20)},
      {name:'Jamhuri Day',             date:new Date(y,11,12)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
      {name:'Boxing Day',              date:new Date(y,11,26)},
    ],
    BR: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Carnival',                date:addDays(easter(y),-48)},
      {name:'Good Friday',             date:addDays(easter(y),-2)},
      {name:'Tiradentes Day',          date:new Date(y,3,21)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Independence Day',        date:new Date(y,8,7)},
      {name:'Our Lady of Aparecida',   date:new Date(y,9,12)},
      {name:'All Souls\' Day',         date:new Date(y,10,2)},
      {name:'Republic Day',            date:new Date(y,10,15)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
    ],
    PK: y => [
      {name:'Kashmir Day',             date:new Date(y,1,5)},
      {name:'Pakistan Day',            date:new Date(y,2,23)},
      {name:'Eid ul-Fitr',             date:new Date(y,2,31)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Eid ul-Adha',             date:new Date(y,5,17)},
      {name:'Independence Day',        date:new Date(y,7,14)},
      {name:'Iqbal Day',               date:new Date(y,10,9)},
      {name:'Quaid-e-Azam Day',        date:new Date(y,11,25)},
    ],
    CN: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Chinese New Year',        date:new Date(y,1,10)},
      {name:'Qingming Festival',       date:new Date(y,3,4)},
      {name:'Labour Day',              date:new Date(y,4,1)},
      {name:'Dragon Boat Festival',    date:new Date(y,5,22)},
      {name:'Mid-Autumn Festival',     date:new Date(y,9,6)},
      {name:'National Day',            date:new Date(y,9,1)},
    ],
    KR: y => [
      {name:'New Year\'s Day',         date:new Date(y,0,1)},
      {name:'Seollal',                 date:new Date(y,1,10)},
      {name:'Independence Movement',   date:new Date(y,2,1)},
      {name:'Children\'s Day',         date:new Date(y,4,5)},
      {name:'Buddha\'s Birthday',      date:new Date(y,4,15)},
      {name:'Memorial Day',            date:new Date(y,5,6)},
      {name:'Liberation Day',          date:new Date(y,7,15)},
      {name:'Chuseok',                 date:new Date(y,9,6)},
      {name:'National Foundation Day', date:new Date(y,9,3)},
      {name:'Hangul Day',              date:new Date(y,9,9)},
      {name:'Christmas Day',           date:new Date(y,11,25)},
    ],
  };

  // Default fallback
  const DEFAULT = y => [
    {name:'New Year\'s Day',           date:new Date(y,0,1)},
    {name:'International Labour Day',  date:new Date(y,4,1)},
    {name:'Christmas Day',             date:new Date(y,11,25)},
    {name:'New Year\'s Eve',           date:new Date(y,11,31)},
  ];

  function getHolidaysForCountry(year, country) {
    const fn = HOLIDAYS[country] || DEFAULT;
    return fn(year);
  }

  function getHolidays(year) {
    const country = inferCountry();
    return getHolidaysForCountry(year, country);
  }

  function updateHolidays() {
    const country = inferCountry();
    const countryName = COUNTRY_NAMES[country] || country;
    const now = new Date(); now.setHours(0,0,0,0);
    const all = [
      ...getHolidaysForCountry(now.getFullYear(), country),
      ...getHolidaysForCountry(now.getFullYear()+1, country)
    ];
    const upcoming = all.filter(h=>h.date>=now).sort((a,b)=>a.date-b.date).slice(0,3);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    upcoming.forEach((h,i) => {
      const days = Math.round((h.date-now)/86400000);
      const n1 = document.getElementById(`hol${i+1}-name`);
      const n2 = document.getElementById(`hol${i+1}-date`);
      const n3 = document.getElementById(`hol${i+1}-days`);
      if (!n1) return;
      n1.textContent = `${h.name} (${countryName})`;
      n2.textContent = `${months[h.date.getMonth()]} ${h.date.getDate()}, ${h.date.getFullYear()}`;
      n3.textContent = days===0?'Today':days===1?'Tomorrow':`${days} days`;
    });
  }

  window.getHolidays = getHolidays;
  window.getHolidaysForCountry = getHolidaysForCountry;
  window.updateHolidays = updateHolidays;
  window.inferCountry = inferCountry;
  window.COUNTRY_NAMES = COUNTRY_NAMES;
  window.TZ_TO_COUNTRY = TZ_TO_COUNTRY;
})();
