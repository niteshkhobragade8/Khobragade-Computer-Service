export const PROFESSIONAL_SERVICE_CATEGORIES = [
  'Aadhaar & Identity Services',
  'PAN Card Services',
  'Voter ID & Election Services',
  'Ayushman Bharat & Health Services',
  'ABHA & Digital Health Services',
  'Divyang & UDID Services',
  'Government Certificates',
  'Maharashtra Government Schemes',
  'Central Government Schemes',
  'Women & Child Welfare Schemes',
  'Pension & Social Security Services',
  'Ration Card & Food Services',
  'Income, Caste & Domicile Services',
  'Land Records & Revenue Services',
  'Agriculture & Farmer Services',
  'RTO & Driving Licence Services',
  'Education & Scholarship Services',
  'Employment & Labour Services',
  'e-Shram & Worker Services',
  'Banking & Financial Services',
  'Insurance Services',
  'EPFO, UAN & Pension Services',
  'Passport & Travel Services',
  'Police & Verification Services',
  'Business, GST & MSME Services',
  'Utility Bill & Recharge Services',
  'Online Application & Form Services',
  'Document, Printing & Digital Services',
  'Maha e-Seva & Aaple Sarkar Services',
  'Other Digital Services'
];

const exact = new Map(PROFESSIONAL_SERVICE_CATEGORIES.map(x => [x.toLowerCase(), x]));
const has = (text, words) => words.some(w => text.includes(w));

export function professionalCategory(rawCategory = '', serviceName = '') {
  const raw = String(rawCategory || '').trim();
  const exactHit = exact.get(raw.toLowerCase());
  if (exactHit) return exactHit;
  const text = `${raw} ${serviceName}`.toLowerCase();

  if (has(text,['aadhaar','aadhar','identity','maha id','mahaid'])) return has(text,['maha id','mahaid']) ? 'Maha e-Seva & Aaple Sarkar Services' : 'Aadhaar & Identity Services';
  if (has(text,['pan card',' pan ','pan '])) return 'PAN Card Services';
  if (has(text,['voter','election','epic'])) return 'Voter ID & Election Services';
  if (has(text,['abha'])) return 'ABHA & Digital Health Services';
  if (has(text,['ayushman','health','pmjay'])) return 'Ayushman Bharat & Health Services';
  if (has(text,['divyang','udid','disability'])) return 'Divyang & UDID Services';
  if (has(text,['income','caste','domicile','nationality'])) return 'Income, Caste & Domicile Services';
  if (has(text,['certificate','birth','death','marriage'])) return 'Government Certificates';
  if (has(text,['ration','food','civil supplies'])) return 'Ration Card & Food Services';
  if (has(text,['land','7/12','7 12','8a','revenue','property card'])) return 'Land Records & Revenue Services';
  if (has(text,['agriculture','farmer','kisan','crop','pm kisan'])) return 'Agriculture & Farmer Services';
  if (has(text,['rto','driving','licence','license','vehicle','rc ','permit'])) return 'RTO & Driving Licence Services';
  if (has(text,['education','scholarship','student','school','college'])) return 'Education & Scholarship Services';
  if (has(text,['e-shram','eshram'])) return 'e-Shram & Worker Services';
  if (has(text,['employment','labour','labor','worker','rojgar'])) return 'Employment & Labour Services';
  if (has(text,['banking','bank ','financial','loan','upi','aeps'])) return 'Banking & Financial Services';
  if (has(text,['insurance','policy'])) return 'Insurance Services';
  if (has(text,['epfo','uan','provident fund'])) return 'EPFO, UAN & Pension Services';
  if (has(text,['pension','senior citizen','social welfare'])) return 'Pension & Social Security Services';
  if (has(text,['passport','travel','visa'])) return 'Passport & Travel Services';
  if (has(text,['police','verification','character certificate'])) return 'Police & Verification Services';
  if (has(text,['gst','msme','udyam','business','shop act','fssai'])) return 'Business, GST & MSME Services';
  if (has(text,['bill payment','utility','electricity','recharge','gas bill','water bill'])) return 'Utility Bill & Recharge Services';
  if (has(text,['photo','print','printing','lamination','document','scan','xerox','digital services'])) return 'Document, Printing & Digital Services';
  if (has(text,['online form','online application','online service','form'])) return 'Online Application & Form Services';
  if (has(text,['women','ladki bahin','mahila','child welfare','girl'])) return 'Women & Child Welfare Schemes';
  if (has(text,['maharashtra','yojana -','scheme','government schemes'])) {
    if (has(text,['maharashtra','yojana -','women','farmer','senior citizen','social welfare'])) return 'Maharashtra Government Schemes';
    return 'Central Government Schemes';
  }
  if (has(text,['aaple sarkar','maha e-seva','maha e seva'])) return 'Maha e-Seva & Aaple Sarkar Services';
  return 'Other Digital Services';
}

export function categoryOptionsHtml(selected = '', allLabel = '') {
  const rows = PROFESSIONAL_SERVICE_CATEGORIES.map(name => `<option value="${name}"${name === selected ? ' selected' : ''}>${name}</option>`).join('');
  return allLabel ? `<option value="all">${allLabel}</option>${rows}` : rows;
}
