// ═══════════════════════════════════════════════════
//  CORE HELPERS
// ═══════════════════════════════════════════════════
const ALL_TZ = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Asia/Kolkata','Asia/Tokyo','Australia/Sydney'
];

const pad  = n => String(n).padStart(2,'0');
const pad3 = n => String(n).padStart(3,'0');

function escapeHTML(v) {
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeJsSingleQuoted(v) {
  return String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'\\r');
}
function getWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  const y = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-y)/86400000)+1)/7);
}
function getDoy(d) {
  const start = new Date(d.getFullYear(),0,1);
  return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-start)/86400000)+1;
}
function isLeap(y) { return (y%4===0&&y%100!==0)||y%400===0; }
function daysInYear(y) { return isLeap(y)?366:365; }
function getOffset(tz) {
  const now=new Date();
  const local=new Date(now.toLocaleString('en-US',{timeZone:tz}));
  const utc=new Date(now.toLocaleString('en-US',{timeZone:'UTC'}));
  const diff=(local-utc)/60000;
  const h=Math.floor(Math.abs(diff)/60),m=Math.abs(diff)%60;
  return `UTC${diff>=0?'+':'-'}${pad(h)}:${pad(m)}`;
}
function formatInTz(tz,use24) {
  return new Date().toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:!use24});
}
function copyVal(id,type) {
  const val=document.getElementById(id).textContent;
  navigator.clipboard?.writeText(val).then(()=>{
    document.querySelectorAll('.copy-btn').forEach(b=>{if(b.getAttribute('onclick')?.includes(type)){b.textContent='✓ Copied';setTimeout(()=>b.textContent='Copy',1600);}});
    if(typeof gtag!=='undefined') trackEvent('copy_timestamp','engagement',type);
  });
}

// ═══════════════════════════════════════════════════
//  ELASTIC TIMEZONE SEARCH DATABASE
//  Covers: US states/cities, countries, abbreviations,
//  Indian cities, global capitals, timezone offsets
// ═══════════════════════════════════════════════════

// Maps search term → IANA timezone + display info
const TZ_SEARCH_DB = [
  // ── USA States & Cities ──────────────────────────
  // Eastern (UTC-5/-4)
  {q:['new york','ny','nyc','manhattan','brooklyn','queens','bronx','staten island','buffalo','rochester','albany','eastern'],    tz:'America/New_York',      label:'New York, US',         abbr:'EST/EDT', country:'US'},
  {q:['florida','miami','orlando','tampa','jacksonville','fort lauderdale','st petersburg','tallahassee'],                          tz:'America/New_York',      label:'Florida, US',          abbr:'EST/EDT', country:'US'},
  {q:['georgia','atlanta','savannah','augusta'],                                                                                     tz:'America/New_York',      label:'Georgia, US',          abbr:'EST/EDT', country:'US'},
  {q:['ohio','columbus','cleveland','cincinnati','toledo','akron'],                                                                 tz:'America/New_York',      label:'Ohio, US',             abbr:'EST/EDT', country:'US'},
  {q:['pennsylvania','philadelphia','pittsburgh','allentown','erie'],                                                               tz:'America/New_York',      label:'Pennsylvania, US',     abbr:'EST/EDT', country:'US'},
  {q:['michigan','detroit','grand rapids','warren','sterling heights','lansing'],                                                   tz:'America/Detroit',       label:'Michigan, US',         abbr:'EST/EDT', country:'US'},
  {q:['massachusetts','boston','worcester','springfield','cambridge'],                                                              tz:'America/New_York',      label:'Massachusetts, US',    abbr:'EST/EDT', country:'US'},
  {q:['north carolina','charlotte','raleigh','greensboro','durham','winston-salem'],                                               tz:'America/New_York',      label:'North Carolina, US',   abbr:'EST/EDT', country:'US'},
  {q:['south carolina','columbia','charleston','greenville'],                                                                       tz:'America/New_York',      label:'South Carolina, US',   abbr:'EST/EDT', country:'US'},
  {q:['virginia','richmond','virginia beach','norfolk','arlington','alexandria'],                                                   tz:'America/New_York',      label:'Virginia, US',         abbr:'EST/EDT', country:'US'},
  {q:['washington dc','district of columbia','dc'],                                                                                tz:'America/New_York',      label:'Washington D.C., US',  abbr:'EST/EDT', country:'US'},
  {q:['maryland','baltimore','silver spring','rockville','annapolis'],                                                             tz:'America/New_York',      label:'Maryland, US',         abbr:'EST/EDT', country:'US'},
  {q:['new jersey','newark','jersey city','paterson','trenton'],                                                                   tz:'America/New_York',      label:'New Jersey, US',       abbr:'EST/EDT', country:'US'},
  {q:['connecticut','bridgeport','hartford','new haven','stamford'],                                                               tz:'America/New_York',      label:'Connecticut, US',      abbr:'EST/EDT', country:'US'},
  {q:['delaware','wilmington','dover'],                                                                                             tz:'America/New_York',      label:'Delaware, US',         abbr:'EST/EDT', country:'US'},
  {q:['new hampshire','manchester','nashua','concord'],                                                                            tz:'America/New_York',      label:'New Hampshire, US',    abbr:'EST/EDT', country:'US'},
  {q:['vermont','burlington','montpelier'],                                                                                         tz:'America/New_York',      label:'Vermont, US',          abbr:'EST/EDT', country:'US'},
  {q:['maine','portland','lewiston','augusta'],                                                                                     tz:'America/New_York',      label:'Maine, US',            abbr:'EST/EDT', country:'US'},
  {q:['rhode island','providence','cranston'],                                                                                     tz:'America/New_York',      label:'Rhode Island, US',     abbr:'EST/EDT', country:'US'},
  {q:['west virginia','charleston','huntington'],                                                                                   tz:'America/New_York',      label:'West Virginia, US',    abbr:'EST/EDT', country:'US'},
  {q:['kentucky','louisville','lexington','frankfort'],                                                                            tz:'America/New_York',      label:'Kentucky (East), US',  abbr:'EST/EDT', country:'US'},
  {q:['tennessee eastern','knoxville','chattanooga'],                                                                              tz:'America/New_York',      label:'East Tennessee, US',   abbr:'EST/EDT', country:'US'},
  {q:['indiana','indianapolis','fort wayne','evansville'],                                                                         tz:'America/Indiana/Indianapolis', label:'Indiana, US',  abbr:'EST/EDT', country:'US'},

  // Central (UTC-6/-5)
  {q:['illinois','chicago','aurora','rockford','joliet','naperville','peoria','central'],                                          tz:'America/Chicago',       label:'Illinois, US',         abbr:'CST/CDT', country:'US'},
  {q:['texas','houston','san antonio','dallas','austin','fort worth','el paso','arlington'],                                       tz:'America/Chicago',       label:'Texas, US',            abbr:'CST/CDT', country:'US'},
  {q:['minnesota','minneapolis','saint paul','rochester'],                                                                         tz:'America/Chicago',       label:'Minnesota, US',        abbr:'CST/CDT', country:'US'},
  {q:['wisconsin','milwaukee','madison','green bay'],                                                                              tz:'America/Chicago',       label:'Wisconsin, US',        abbr:'CST/CDT', country:'US'},
  {q:['iowa','des moines','cedar rapids','davenport'],                                                                             tz:'America/Chicago',       label:'Iowa, US',             abbr:'CST/CDT', country:'US'},
  {q:['missouri','kansas city','st louis','springfield','columbia'],                                                               tz:'America/Chicago',       label:'Missouri, US',         abbr:'CST/CDT', country:'US'},
  {q:['louisiana','new orleans','baton rouge','shreveport'],                                                                       tz:'America/Chicago',       label:'Louisiana, US',        abbr:'CST/CDT', country:'US'},
  {q:['arkansas','little rock','fort smith','fayetteville'],                                                                       tz:'America/Chicago',       label:'Arkansas, US',         abbr:'CST/CDT', country:'US'},
  {q:['mississippi','jackson','gulfport','biloxi'],                                                                                tz:'America/Chicago',       label:'Mississippi, US',      abbr:'CST/CDT', country:'US'},
  {q:['alabama','birmingham','montgomery','huntsville','mobile'],                                                                   tz:'America/Chicago',       label:'Alabama, US',          abbr:'CST/CDT', country:'US'},
  {q:['oklahoma','oklahoma city','tulsa','norman'],                                                                                tz:'America/Chicago',       label:'Oklahoma, US',         abbr:'CST/CDT', country:'US'},
  {q:['kansas','wichita','overland park','topeka'],                                                                                tz:'America/Chicago',       label:'Kansas, US',           abbr:'CST/CDT', country:'US'},
  {q:['nebraska','omaha','lincoln','bellevue'],                                                                                    tz:'America/Chicago',       label:'Nebraska, US',         abbr:'CST/CDT', country:'US'},
  {q:['south dakota','sioux falls','rapid city'],                                                                                  tz:'America/Chicago',       label:'South Dakota, US',     abbr:'CST/CDT', country:'US'},
  {q:['north dakota','fargo','bismarck','grand forks'],                                                                            tz:'America/Chicago',       label:'North Dakota, US',     abbr:'CST/CDT', country:'US'},
  {q:['tennessee western','memphis','nashville'],                                                                                  tz:'America/Chicago',       label:'Tennessee, US',        abbr:'CST/CDT', country:'US'},

  // Mountain (UTC-7/-6)
  {q:['colorado','denver','colorado springs','aurora','lakewood','fort collins','boulder','mountain'],                             tz:'America/Denver',        label:'Colorado, US',         abbr:'MST/MDT', country:'US'},
  {q:['utah','salt lake city','west valley city','provo','west jordan'],                                                           tz:'America/Denver',        label:'Utah, US',             abbr:'MST/MDT', country:'US'},
  {q:['montana','billings','missoula','great falls','bozeman'],                                                                   tz:'America/Denver',        label:'Montana, US',          abbr:'MST/MDT', country:'US'},
  {q:['wyoming','cheyenne','casper','laramie'],                                                                                    tz:'America/Denver',        label:'Wyoming, US',          abbr:'MST/MDT', country:'US'},
  {q:['new mexico','albuquerque','las cruces','rio rancho','santa fe'],                                                            tz:'America/Denver',        label:'New Mexico, US',       abbr:'MST/MDT', country:'US'},
  {q:['idaho','boise','nampa','meridian','idaho falls'],                                                                           tz:'America/Denver',        label:'Idaho, US',            abbr:'MST/MDT', country:'US'},
  {q:['arizona','phoenix','tucson','mesa','chandler','scottsdale','glendale','gilbert'],                                           tz:'America/Phoenix',       label:'Arizona, US',          abbr:'MST',     country:'US'},
  {q:['nevada','las vegas','henderson','reno','north las vegas'],                                                                  tz:'America/Los_Angeles',   label:'Nevada, US',           abbr:'PST/PDT', country:'US'},

  // Pacific (UTC-8/-7)
  {q:['california','los angeles','san diego','san jose','san francisco','fresno','sacramento','long beach','oakland','bakersfield','anaheim','santa ana','pacific'],
                                                                                                                                    tz:'America/Los_Angeles',   label:'California, US',       abbr:'PST/PDT', country:'US'},
  {q:['washington state','seattle','spokane','tacoma','bellevue','kent','everett'],                                                tz:'America/Los_Angeles',   label:'Washington State, US', abbr:'PST/PDT', country:'US'},
  {q:['oregon','portland','eugene','salem','gresham'],                                                                            tz:'America/Los_Angeles',   label:'Oregon, US',           abbr:'PST/PDT', country:'US'},

  // Alaska & Hawaii
  {q:['alaska','anchorage','fairbanks','juneau'],                                                                                  tz:'America/Anchorage',     label:'Alaska, US',           abbr:'AKST',    country:'US'},
  {q:['hawaii','honolulu','hilo','kailua','pearlcity'],                                                                           tz:'Pacific/Honolulu',      label:'Hawaii, US',           abbr:'HST',     country:'US'},

  // EST/CST/MST/PST abbreviations
  {q:['est','eastern standard','eastern time'],                                                                                    tz:'America/New_York',      label:'Eastern Time (EST)',   abbr:'EST/EDT', country:'US'},
  {q:['cst','central standard','central time'],                                                                                    tz:'America/Chicago',       label:'Central Time (CST)',   abbr:'CST/CDT', country:'US'},
  {q:['mst','mountain standard','mountain time'],                                                                                  tz:'America/Denver',        label:'Mountain Time (MST)',  abbr:'MST/MDT', country:'US'},
  {q:['pst','pacific standard','pacific time'],                                                                                    tz:'America/Los_Angeles',   label:'Pacific Time (PST)',   abbr:'PST/PDT', country:'US'},
  {q:['akst','alaska time'],                                                                                                        tz:'America/Anchorage',     label:'Alaska Time (AKST)',   abbr:'AKST',    country:'US'},
  {q:['hst','hawaii time'],                                                                                                         tz:'Pacific/Honolulu',      label:'Hawaii Time (HST)',    abbr:'HST',     country:'US'},

  // ── CANADA ───────────────────────────────────────
  {q:['toronto','ontario','ottawa'],                                                                                                tz:'America/Toronto',       label:'Toronto, Canada',      abbr:'EST/EDT', country:'CA'},
  {q:['vancouver','british columbia','bc'],                                                                                        tz:'America/Vancouver',     label:'Vancouver, Canada',    abbr:'PST/PDT', country:'CA'},
  {q:['montreal','quebec','qc'],                                                                                                   tz:'America/Toronto',       label:'Montreal, Canada',     abbr:'EST/EDT', country:'CA'},
  {q:['calgary','alberta','ab'],                                                                                                   tz:'America/Edmonton',      label:'Calgary, Canada',      abbr:'MST/MDT', country:'CA'},
  {q:['winnipeg','manitoba','mb'],                                                                                                 tz:'America/Winnipeg',      label:'Winnipeg, Canada',     abbr:'CST/CDT', country:'CA'},

  // ── INDIA ────────────────────────────────────────
  {q:['india','ist','mumbai','delhi','new delhi','bangalore','bengaluru','chennai','hyderabad','kolkata','calcutta','pune','ahmedabad','jaipur','surat','lucknow','kanpur','nagpur','indore','bhopal','patna','vadodara','ludhiana','agra','nashik','meerut','rajkot','varanasi','amritsar','allahabad','kochi','coimbatore','visakhapatnam','chandigarh','bhubaneswar'],
                                                                                                                                    tz:'Asia/Kolkata',          label:'India (IST)',           abbr:'IST',     country:'IN'},

  // ── UK ───────────────────────────────────────────
  {q:['uk','united kingdom','england','london','birmingham','manchester','leeds','glasgow','edinburgh','liverpool','bristol','sheffield','cardiff','belfast','gmt','bst'],
                                                                                                                                    tz:'Europe/London',         label:'United Kingdom',       abbr:'GMT/BST', country:'GB'},

  // ── EUROPE ───────────────────────────────────────
  {q:['france','paris','lyon','marseille','toulouse','cet','cest'],                                                                tz:'Europe/Paris',          label:'France',               abbr:'CET/CEST',country:'FR'},
  {q:['germany','berlin','munich','hamburg','frankfurt','cologne','dusseldorf'],                                                   tz:'Europe/Berlin',         label:'Germany',              abbr:'CET/CEST',country:'DE'},
  {q:['spain','madrid','barcelona','seville','valencia'],                                                                          tz:'Europe/Madrid',         label:'Spain',                abbr:'CET/CEST',country:'ES'},
  {q:['italy','rome','milan','naples','turin','palermo'],                                                                          tz:'Europe/Rome',           label:'Italy',                abbr:'CET/CEST',country:'IT'},
  {q:['netherlands','amsterdam','rotterdam','the hague'],                                                                          tz:'Europe/Amsterdam',      label:'Netherlands',          abbr:'CET/CEST',country:'NL'},
  {q:['switzerland','zurich','geneva','bern','basel'],                                                                             tz:'Europe/Zurich',         label:'Switzerland',          abbr:'CET/CEST',country:'CH'},
  {q:['russia','moscow','saint petersburg','msk'],                                                                                 tz:'Europe/Moscow',         label:'Moscow, Russia',       abbr:'MSK',     country:'RU'},
  {q:['turkey','istanbul','ankara','izmir','trt'],                                                                                 tz:'Europe/Istanbul',       label:'Turkey',               abbr:'TRT',     country:'TR'},
  {q:['ukraine','kyiv','kiev','kharkiv','odessa'],                                                                                 tz:'Europe/Kiev',           label:'Ukraine',              abbr:'EET',     country:'UA'},
  {q:['poland','warsaw','krakow','lodz','wroclaw'],                                                                               tz:'Europe/Warsaw',         label:'Poland',               abbr:'CET/CEST',country:'PL'},
  {q:['sweden','stockholm','gothenburg','malmo'],                                                                                  tz:'Europe/Stockholm',      label:'Sweden',               abbr:'CET/CEST',country:'SE'},
  {q:['norway','oslo','bergen','trondheim'],                                                                                       tz:'Europe/Oslo',           label:'Norway',               abbr:'CET/CEST',country:'NO'},
  {q:['denmark','copenhagen','aarhus'],                                                                                            tz:'Europe/Copenhagen',     label:'Denmark',              abbr:'CET/CEST',country:'DK'},
  {q:['finland','helsinki','espoo','tampere','eet'],                                                                               tz:'Europe/Helsinki',       label:'Finland',              abbr:'EET/EEST',country:'FI'},
  {q:['greece','athens','thessaloniki'],                                                                                            tz:'Europe/Athens',         label:'Greece',               abbr:'EET/EEST',country:'GR'},
  {q:['portugal','lisbon','porto','wet'],                                                                                          tz:'Europe/Lisbon',         label:'Portugal',             abbr:'WET/WEST',country:'PT'},
  {q:['belgium','brussels','antwerp','ghent'],                                                                                     tz:'Europe/Brussels',       label:'Belgium',              abbr:'CET/CEST',country:'BE'},
  {q:['austria','vienna','graz','linz'],                                                                                           tz:'Europe/Vienna',         label:'Austria',              abbr:'CET/CEST',country:'AT'},
  {q:['romania','bucharest','cluj','timisoara'],                                                                                   tz:'Europe/Bucharest',      label:'Romania',              abbr:'EET/EEST',country:'RO'},
  {q:['czech','prague','brno','ostrava'],                                                                                          tz:'Europe/Prague',         label:'Czech Republic',       abbr:'CET/CEST',country:'CZ'},
  {q:['hungary','budapest','debrecen'],                                                                                            tz:'Europe/Budapest',       label:'Hungary',              abbr:'CET/CEST',country:'HU'},
  {q:['ireland','dublin','cork','galway','iet'],                                                                                   tz:'Europe/Dublin',         label:'Ireland',              abbr:'GMT/IST', country:'IE'},

  // ── MIDDLE EAST ──────────────────────────────────
  {q:['uae','dubai','abu dhabi','sharjah','gst','gulf'],                                                                           tz:'Asia/Dubai',            label:'UAE',                  abbr:'GST',     country:'AE'},
  {q:['saudi arabia','riyadh','jeddah','mecca','medina','ast'],                                                                   tz:'Asia/Riyadh',           label:'Saudi Arabia',         abbr:'AST',     country:'SA'},
  {q:['qatar','doha'],                                                                                                              tz:'Asia/Qatar',            label:'Qatar',                abbr:'AST',     country:'QA'},
  {q:['kuwait','kuwait city'],                                                                                                     tz:'Asia/Kuwait',           label:'Kuwait',               abbr:'AST',     country:'KW'},
  {q:['israel','tel aviv','jerusalem','haifa'],                                                                                    tz:'Asia/Jerusalem',        label:'Israel',               abbr:'IST',     country:'IL'},
  {q:['iran','tehran','isfahan','irst'],                                                                                           tz:'Asia/Tehran',           label:'Iran',                 abbr:'IRST',    country:'IR'},

  // ── ASIA ─────────────────────────────────────────
  {q:['pakistan','karachi','lahore','islamabad','rawalpindi','pkt'],                                                               tz:'Asia/Karachi',          label:'Pakistan',             abbr:'PKT',     country:'PK'},
  {q:['bangladesh','dhaka','chittagong','bst'],                                                                                   tz:'Asia/Dhaka',            label:'Bangladesh',           abbr:'BST',     country:'BD'},
  {q:['sri lanka','colombo','kandy','slst'],                                                                                      tz:'Asia/Colombo',          label:'Sri Lanka',            abbr:'SLST',    country:'LK'},
  {q:['nepal','kathmandu','pokhara','npt'],                                                                                       tz:'Asia/Kathmandu',        label:'Nepal',                abbr:'NPT',     country:'NP'},
  {q:['singapore','sgt'],                                                                                                          tz:'Asia/Singapore',        label:'Singapore',            abbr:'SGT',     country:'SG'},
  {q:['malaysia','kuala lumpur','kl','penang','myt'],                                                                             tz:'Asia/Kuala_Lumpur',     label:'Malaysia',             abbr:'MYT',     country:'MY'},
  {q:['thailand','bangkok','chiang mai','ict'],                                                                                   tz:'Asia/Bangkok',          label:'Thailand',             abbr:'ICT',     country:'TH'},
  {q:['vietnam','ho chi minh','hanoi','saigon','ict'],                                                                            tz:'Asia/Ho_Chi_Minh',      label:'Vietnam',              abbr:'ICT',     country:'VN'},
  {q:['indonesia','jakarta','bali','bandung','surabaya','wib'],                                                                   tz:'Asia/Jakarta',          label:'Indonesia',            abbr:'WIB',     country:'ID'},
  {q:['philippines','manila','quezon city','pht'],                                                                                tz:'Asia/Manila',           label:'Philippines',          abbr:'PHT',     country:'PH'},
  {q:['china','beijing','shanghai','guangzhou','shenzhen','cst'],                                                                 tz:'Asia/Shanghai',         label:'China',                abbr:'CST',     country:'CN'},
  {q:['hong kong','hkt'],                                                                                                          tz:'Asia/Hong_Kong',        label:'Hong Kong',            abbr:'HKT',     country:'HK'},
  {q:['taiwan','taipei','tst'],                                                                                                   tz:'Asia/Taipei',           label:'Taiwan',               abbr:'CST',     country:'TW'},
  {q:['japan','tokyo','osaka','kyoto','jst'],                                                                                     tz:'Asia/Tokyo',            label:'Japan',                abbr:'JST',     country:'JP'},
  {q:['south korea','korea','seoul','busan','kst'],                                                                               tz:'Asia/Seoul',            label:'South Korea',          abbr:'KST',     country:'KR'},
  {q:['myanmar','yangon','rangoon','mmt'],                                                                                        tz:'Asia/Yangon',           label:'Myanmar',              abbr:'MMT',     country:'MM'},
  {q:['cambodia','phnom penh','ict'],                                                                                             tz:'Asia/Phnom_Penh',       label:'Cambodia',             abbr:'ICT',     country:'KH'},
  {q:['afghanistan','kabul','aft'],                                                                                               tz:'Asia/Kabul',            label:'Afghanistan',          abbr:'AFT',     country:'AF'},
  {q:['uzbekistan','tashkent','uzt'],                                                                                             tz:'Asia/Tashkent',         label:'Uzbekistan',           abbr:'UZT',     country:'UZ'},

  // ── AUSTRALIA & PACIFIC ──────────────────────────
  {q:['australia','sydney','melbourne','brisbane','perth','adelaide','canberra','aest','aedt'],                                   tz:'Australia/Sydney',      label:'Australia (East)',     abbr:'AEST',    country:'AU'},
  {q:['western australia','perth','awst'],                                                                                        tz:'Australia/Perth',       label:'Perth, Australia',     abbr:'AWST',    country:'AU'},
  {q:['south australia','adelaide','acst'],                                                                                       tz:'Australia/Adelaide',    label:'Adelaide, Australia',  abbr:'ACST',    country:'AU'},
  {q:['new zealand','auckland','wellington','nzst','nzdt'],                                                                       tz:'Pacific/Auckland',      label:'New Zealand',          abbr:'NZST',    country:'NZ'},
  {q:['fiji','suva','fjt'],                                                                                                        tz:'Pacific/Fiji',          label:'Fiji',                 abbr:'FJT',     country:'FJ'},

  // ── AFRICA ───────────────────────────────────────
  {q:['south africa','johannesburg','cape town','durban','sast'],                                                                  tz:'Africa/Johannesburg',   label:'South Africa',         abbr:'SAST',    country:'ZA'},
  {q:['nigeria','lagos','abuja','wat'],                                                                                            tz:'Africa/Lagos',          label:'Nigeria',              abbr:'WAT',     country:'NG'},
  {q:['kenya','nairobi','eat'],                                                                                                   tz:'Africa/Nairobi',        label:'Kenya',                abbr:'EAT',     country:'KE'},
  {q:['egypt','cairo','eet'],                                                                                                     tz:'Africa/Cairo',          label:'Egypt',                abbr:'EET',     country:'EG'},
  {q:['ghana','accra','gmt'],                                                                                                     tz:'Africa/Accra',          label:'Ghana',                abbr:'GMT',     country:'GH'},
  {q:['ethiopia','addis ababa','eat'],                                                                                            tz:'Africa/Addis_Ababa',    label:'Ethiopia',             abbr:'EAT',     country:'ET'},
  {q:['morocco','casablanca','rabat','wet'],                                                                                      tz:'Africa/Casablanca',     label:'Morocco',              abbr:'WET',     country:'MA'},
  {q:['tanzania','dar es salaam','eat'],                                                                                          tz:'Africa/Dar_es_Salaam',  label:'Tanzania',             abbr:'EAT',     country:'TZ'},

  // ── LATIN AMERICA ────────────────────────────────
  {q:['brazil','sao paulo','rio de janeiro','brasilia','brt'],                                                                    tz:'America/Sao_Paulo',     label:'Brazil',               abbr:'BRT',     country:'BR'},
  {q:['argentina','buenos aires','art'],                                                                                          tz:'America/Argentina/Buenos_Aires', label:'Argentina',    abbr:'ART',     country:'AR'},
  {q:['mexico','mexico city','guadalajara','monterrey','cst'],                                                                    tz:'America/Mexico_City',   label:'Mexico',               abbr:'CST/CDT', country:'MX'},
  {q:['colombia','bogota','cot'],                                                                                                 tz:'America/Bogota',        label:'Colombia',             abbr:'COT',     country:'CO'},
  {q:['peru','lima','pet'],                                                                                                       tz:'America/Lima',          label:'Peru',                 abbr:'PET',     country:'PE'},
  {q:['chile','santiago','clt'],                                                                                                  tz:'America/Santiago',      label:'Chile',                abbr:'CLT',     country:'CL'},
  {q:['venezuela','caracas','vet'],                                                                                               tz:'America/Caracas',       label:'Venezuela',            abbr:'VET',     country:'VE'},

  // ── UTC ──────────────────────────────────────────
  {q:['utc','universal','gmt+0','gmt 0','utc+0'],                                                                                 tz:'Etc/UTC',               label:'UTC (Universal Time)', abbr:'UTC',     country:''},
];

// Country flag emoji map
const COUNTRY_FLAG = {
  US:'🇺🇸', IN:'🇮🇳', GB:'🇬🇧', AU:'🇦🇺', CA:'🇨🇦', JP:'🇯🇵', DE:'🇩🇪', FR:'🇫🇷',
  AE:'🇦🇪', SG:'🇸🇬', ZA:'🇿🇦', NG:'🇳🇬', KE:'🇰🇪', BR:'🇧🇷', PK:'🇵🇰', NZ:'🇳🇿',
  CN:'🇨🇳', KR:'🇰🇷', RU:'🇷🇺', TR:'🇹🇷', MX:'🇲🇽', AR:'🇦🇷', CO:'🇨🇴', PE:'🇵🇪',
  CL:'🇨🇱', VE:'🇻🇪', IT:'🇮🇹', ES:'🇪🇸', NL:'🇳🇱', SE:'🇸🇪', NO:'🇳🇴', DK:'🇩🇰',
  FI:'🇫🇮', GR:'🇬🇷', PT:'🇵🇹', BE:'🇧🇪', AT:'🇦🇹', CH:'🇨🇭', PL:'🇵🇱', RO:'🇷🇴',
  CZ:'🇨🇿', HU:'🇭🇺', UA:'🇺🇦', IE:'🇮🇪', IL:'🇮🇱', SA:'🇸🇦', QA:'🇶🇦', KW:'🇰🇼',
  IR:'🇮🇷', BD:'🇧🇩', LK:'🇱🇰', NP:'🇳🇵', MY:'🇲🇾', TH:'🇹🇭', VN:'🇻🇳', ID:'🇮🇩',
  PH:'🇵🇭', HK:'🇭🇰', TW:'🇹🇼', MM:'🇲🇲', KH:'🇰🇭', AF:'🇦🇫', UZ:'🇺🇿', FJ:'🇫🇯',
  EG:'🇪🇬', GH:'🇬🇭', ET:'🇪🇹', MA:'🇲🇦', TZ:'🇹🇿',
};

// ── Elastic search function ──────────────────────────
function tzElasticSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 1) return [];

  const results = [];
  const seenTz = new Set();

  // 1. Search our rich database
  for (const entry of TZ_SEARCH_DB) {
    let score = 0;
    let matchedWord = '';

    for (const keyword of entry.q) {
      if (keyword === q)                              { score = 100; matchedWord = keyword; break; }
      if (keyword.startsWith(q) && score < 80)       { score = 80;  matchedWord = keyword; }
      else if (keyword.includes(q) && score < 50)    { score = 50;  matchedWord = keyword; }
      else if (q.includes(keyword) && keyword.length > 3 && score < 40) { score = 40; matchedWord = keyword; }
    }
    if (entry.abbr && entry.abbr.toLowerCase().includes(q) && score < 70) { score = 70; matchedWord = entry.abbr; }
    if (entry.label.toLowerCase().includes(q) && score < 60)              { score = 60; matchedWord = q; }

    if (score > 0 && !seenTz.has(entry.tz + entry.label)) {
      seenTz.add(entry.tz + entry.label);
      // Title-case the matched word so it looks nice in the dropdown
      const matchDisplay = matchedWord
        ? matchedWord.replace(/\b\w/g, c => c.toUpperCase())
        : '';
      results.push({ ...entry, score, matchDisplay });
    }
  }

  // 2. Fallback: scan ALL_TZ IANA list
  for (const tz of ALL_TZ) {
    const tzLower = tz.toLowerCase().replace(/_/g,' ');
    let score = 0;
    if (tzLower === q)            score = 90;
    else if (tzLower.includes(q)) score = 30;
    if (score > 0 && !seenTz.has(tz + tz)) {
      seenTz.add(tz + tz);
      const city = tz.split('/').pop().replace(/_/g,' ');
      results.push({ tz, label: city, abbr: getOffset(tz), country:'', score, matchDisplay: city });
    }
  }

  return results.sort((a,b) => b.score - a.score).slice(0, 12);
}

// ── Render search results dropdown ──────────────────
function renderTzResults(results, containerEl, onSelect) {
  if (!results.length) {
    containerEl.innerHTML = `<div class="tz-item tz-no-result">No results found</div>`;
    containerEl.classList.add('open');
    return;
  }
  containerEl.innerHTML = results.map(r => {
    const flag = COUNTRY_FLAG[r.country] || '🌐';
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US',{timeZone:r.tz}));
    const th = tzDate.getHours(), tm = tzDate.getMinutes();
    const timeStr = `${pad(th)}:${pad(tm)}`;

    // Show the specific matched place name as the primary label
    // e.g. search "chennai" → primary: "Chennai", secondary: "India (IST)"
    const matchedDisplay = r.matchDisplay || r.label;
    const isMatchDifferentFromLabel = matchedDisplay.toLowerCase() !== r.label.toLowerCase();
    const primaryName = matchedDisplay;
    const secondaryName = isMatchDifferentFromLabel ? r.label : '';

    return `<div class="tz-item" onmousedown="event.preventDefault()" onclick="${onSelect}('${escapeJsSingleQuoted(r.tz)}','${escapeJsSingleQuoted(primaryName)}','${escapeJsSingleQuoted(r.abbr)}')">
      <span class="tz-item-flag">${flag}</span>
      <span class="tz-item-info">
        <span class="tz-item-name">${escapeHTML(primaryName)}</span>
        <span class="tz-item-abbr">${secondaryName ? escapeHTML(secondaryName) + ' · ' : ''}${escapeHTML(r.abbr)}</span>
      </span>
      <span class="tz-item-right">
        <span class="tz-item-time">${timeStr}</span>
        <span class="tz-item-off">${getOffset(r.tz)}</span>
      </span>
    </div>`;
  }).join('');
  containerEl.classList.add('open');
}

window.tzElasticSearch = tzElasticSearch;
window.renderTzResults = renderTzResults;
window.COUNTRY_FLAG = COUNTRY_FLAG;
window.TZ_SEARCH_DB = TZ_SEARCH_DB;
