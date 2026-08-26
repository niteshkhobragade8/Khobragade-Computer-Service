
export const SERVICE_CATEGORIES = [
  "Aadhaar & Identity Services",
  "PAN Card Services",
  "Voter ID & Election Services",
  "Ayushman Bharat & Health Services",
  "ABHA & Digital Health Services",
  "Divyang & UDID Services",
  "Government Certificates",
  "Maharashtra Government Schemes",
  "Central Government Schemes",
  "Women & Child Welfare Schemes",
  "Pension & Social Security Services",
  "Ration Card & Food Services",
  "Income, Caste & Domicile Services",
  "Land Records & Revenue Services",
  "Agriculture & Farmer Services",
  "RTO & Driving Licence Services",
  "Education & Scholarship Services",
  "Employment & Labour Services",
  "e-Shram & Worker Services",
  "Banking & Financial Services",
  "Insurance Services",
  "EPFO, UAN & Pension Services",
  "Passport & Travel Services",
  "Police & Verification Services",
  "Business, GST & MSME Services",
  "Utility Bill & Recharge Services",
  "Online Application & Form Services",
  "Document, Printing & Digital Services",
  "Maha e-Seva & Aaple Sarkar Services",
  "Other Digital Services"
];

const CATEGORY_ICONS = {
  "Aadhaar & Identity Services":"🪪",
  "PAN Card Services":"💳",
  "Voter ID & Election Services":"🗳️",
  "Ayushman Bharat & Health Services":"🏥",
  "ABHA & Digital Health Services":"🩺",
  "Divyang & UDID Services":"♿",
  "Government Certificates":"📜",
  "Maharashtra Government Schemes":"🏛️",
  "Central Government Schemes":"🇮🇳",
  "Women & Child Welfare Schemes":"👩‍👧",
  "Pension & Social Security Services":"👴",
  "Ration Card & Food Services":"🍚",
  "Income, Caste & Domicile Services":"📄",
  "Land Records & Revenue Services":"🌾",
  "Agriculture & Farmer Services":"🚜",
  "RTO & Driving Licence Services":"🚘",
  "Education & Scholarship Services":"🎓",
  "Employment & Labour Services":"💼",
  "e-Shram & Worker Services":"👷",
  "Banking & Financial Services":"🏦",
  "Insurance Services":"🛡️",
  "EPFO, UAN & Pension Services":"💰",
  "Passport & Travel Services":"✈️",
  "Police & Verification Services":"👮",
  "Business, GST & MSME Services":"🏢",
  "Utility Bill & Recharge Services":"💡",
  "Online Application & Form Services":"📝",
  "Document, Printing & Digital Services":"🖨️",
  "Maha e-Seva & Aaple Sarkar Services":"💻",
  "Other Digital Services":"🧰"
};

export function professionalCategory(service={}){
  const t = `${service.name||""} ${service.category||""} ${service.description||""}`.toLowerCase();
  if(/pan\b/.test(t)) return "PAN Card Services";
  if(/voter|election|epic/.test(t)) return "Voter ID & Election Services";
  if(/ayushman/.test(t)) return "Ayushman Bharat & Health Services";
  if(/\babha\b|health id|digital health/.test(t)) return "ABHA & Digital Health Services";
  if(/divyang|udid|disabil/.test(t)) return "Divyang & UDID Services";
  if(/aadhaar|identity|id card/.test(t)) return "Aadhaar & Identity Services";
  if(/maha e|aaple sarkar/.test(t)) return "Maha e-Seva & Aaple Sarkar Services";
  if(/maha|maharashtra|ladki|yojana/.test(t)) return "Maharashtra Government Schemes";
  if(/women|child|mahila|bal/.test(t)) return "Women & Child Welfare Schemes";
  if(/ration|food|civil supplies/.test(t)) return "Ration Card & Food Services";
  if(/income|caste|domicile|non creamy|nationality/.test(t)) return "Income, Caste & Domicile Services";
  if(/land|7\/12|8a|property|revenue|bhulekh/.test(t)) return "Land Records & Revenue Services";
  if(/agri|farmer|kisan|crop|pm-kisan/.test(t)) return "Agriculture & Farmer Services";
  if(/rto|driving|licen[cs]e|vehicle|rc\b|challan/.test(t)) return "RTO & Driving Licence Services";
  if(/scholar|education|student|admission|exam|migration/.test(t)) return "Education & Scholarship Services";
  if(/e-?shram|worker|labour|labor/.test(t)) return "e-Shram & Worker Services";
  if(/employment|job|rojgar/.test(t)) return "Employment & Labour Services";
  if(/epfo|\bpf\b|uan/.test(t)) return "EPFO, UAN & Pension Services";
  if(/pension|jeevan pramaan|social security/.test(t)) return "Pension & Social Security Services";
  if(/bank|financial|loan|account|aeps/.test(t)) return "Banking & Financial Services";
  if(/insurance|pmjjby|pmsby/.test(t)) return "Insurance Services";
  if(/passport|travel|visa|ticket/.test(t)) return "Passport & Travel Services";
  if(/police|verification|character/.test(t)) return "Police & Verification Services";
  if(/gst|udyam|msme|business|shop act|gumasta|fssai|trade/.test(t)) return "Business, GST & MSME Services";
  if(/bill|recharge|electric|gas|water|utility/.test(t)) return "Utility Bill & Recharge Services";
  if(/certificate|birth|death|marriage|affidavit/.test(t)) return "Government Certificates";
  if(/form|application|online/.test(t)) return "Online Application & Form Services";
  if(/photo|print|xerox|laminat|scan|document|pdf|typing/.test(t)) return "Document, Printing & Digital Services";
  if(/scheme|government/.test(t)) return "Central Government Schemes";
  return "Other Digital Services";
}

export function categoryCardHTML(active="all"){
  const cards = [
    `<button type="button" class="svc-cat-card svc-cat-all ${active==="all"?"active":""}" data-cat="all">
      <span class="svc-cat-icon">🧩</span><span class="svc-cat-label">All Categories</span>
    </button>`
  ];
  SERVICE_CATEGORIES.forEach((name)=>{
    const icon = CATEGORY_ICONS[name] || "🧰";
    cards.push(
      `<button type="button" class="svc-cat-card ${active===name?"active":""}" data-cat="${name.replaceAll('"','&quot;')}">
        <span class="svc-cat-icon">${icon}</span>
        <span class="svc-cat-label">${name}</span>
      </button>`
    );
  });
  return cards.join("");
}

export function installCategoryCardStyles(){
  if(document.getElementById("svcCategoryStyles")) return;
  const s=document.createElement("style");
  s.id="svcCategoryStyles";
  s.textContent=`
    .svc-cat-wrap{
      display:flex;
      flex-wrap:wrap;
      gap:10px 14px;
      margin:12px 0 18px;
      padding:10px 12px;
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(15,23,42,.05)
    }
    .svc-cat-card{
      width:92px;
      min-height:82px;
      border:0;
      background:transparent;
      color:#1f2937;
      border-radius:10px;
      padding:7px 5px;
      cursor:pointer;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-start;
      gap:5px;
      transition:background .16s ease,transform .16s ease,box-shadow .16s ease;
      font-family:inherit
    }
    .svc-cat-card:hover{
      background:#f8fafc;
      transform:translateY(-1px);
      box-shadow:0 4px 10px rgba(15,23,42,.08)
    }
    .svc-cat-card.active{
      background:#eff6ff;
      box-shadow:inset 0 0 0 2px #2563eb,0 3px 10px rgba(37,99,235,.12)
    }
    .svc-cat-icon{
      width:42px;
      height:42px;
      display:grid;
      place-items:center;
      font-size:29px;
      line-height:1;
      background:linear-gradient(180deg,#ffffff,#f3f4f6);
      border:1px solid #e5e7eb;
      border-radius:10px;
      box-shadow:0 2px 6px rgba(15,23,42,.10)
    }
    .svc-cat-label{
      display:block;
      width:100%;
      text-align:center;
      font-size:11px;
      line-height:1.15;
      font-weight:700;
      color:#334155;
      overflow-wrap:anywhere
    }
    .svc-cat-all .svc-cat-icon{background:linear-gradient(180deg,#dbeafe,#bfdbfe)}
    /* Admin only: match the normal/user portal proportions while using the full content width. */
    body:has(#servicesCategoryCards) #servicesCategoryCards,
    body:has(#actionsCategoryCards) #actionsCategoryCards,
    body:has(#formsCategoryCards) #formsCategoryCards,
    body:has(#chargesCategoryCards) #chargesCategoryCards,
    body:has(#allChargesCategoryCards) #allChargesCategoryCards{
      display:grid;
      grid-template-columns:repeat(9,minmax(82px,1fr));
      column-gap:10px;
      row-gap:10px;
      align-items:start;
      justify-content:stretch;
    }
    #servicesCategoryCards .svc-cat-card,
    #actionsCategoryCards .svc-cat-card,
    #formsCategoryCards .svc-cat-card,
    #chargesCategoryCards .svc-cat-card,
    #allChargesCategoryCards .svc-cat-card{
      width:100%;
      min-width:0;
      min-height:82px;
    }
    @media(max-width:1100px){
      body:has(#servicesCategoryCards) #servicesCategoryCards,
      body:has(#actionsCategoryCards) #actionsCategoryCards,
      body:has(#formsCategoryCards) #formsCategoryCards,
      body:has(#chargesCategoryCards) #chargesCategoryCards,
      body:has(#allChargesCategoryCards) #allChargesCategoryCards{
        grid-template-columns:repeat(8,minmax(78px,1fr));
      }
    }
    @media(max-width:640px){
      .svc-cat-wrap{gap:8px 6px;padding:8px;justify-content:flex-start}
      .svc-cat-card{width:78px;min-height:76px;padding:5px 3px}
      .svc-cat-icon{width:38px;height:38px;font-size:26px}
      .svc-cat-label{font-size:10px}
      body:has(#servicesCategoryCards) #servicesCategoryCards,
      body:has(#actionsCategoryCards) #actionsCategoryCards,
      body:has(#formsCategoryCards) #formsCategoryCards,
      body:has(#chargesCategoryCards) #chargesCategoryCards,
      body:has(#allChargesCategoryCards) #allChargesCategoryCards{
        grid-template-columns:repeat(3,minmax(0,1fr));
      }
    }
  `;
  document.head.appendChild(s);
}
