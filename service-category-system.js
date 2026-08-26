export const SERVICE_CATEGORIES=["Aadhaar & Identity Services","PAN Card Services","Voter ID & Election Services","Ayushman Bharat & Health Services","ABHA & Digital Health Services","Divyang & UDID Services","Government Certificates","Maharashtra Government Schemes","Central Government Schemes","Women & Child Welfare Schemes","Pension & Social Security Services","Ration Card & Food Services","Income, Caste & Domicile Services","Land Records & Revenue Services","Agriculture & Farmer Services","RTO & Driving Licence Services","Education & Scholarship Services","Employment & Labour Services","e-Shram & Worker Services","Banking & Financial Services","Insurance Services","EPFO, UAN & Pension Services","Passport & Travel Services","Police & Verification Services","Business, GST & MSME Services","Utility Bill & Recharge Services","Online Application & Form Services","Document, Printing & Digital Services","Maha e-Seva & Aaple Sarkar Services","Other Digital Services"];
export function professionalCategory(s={}){const t=`${s.name||''} ${s.category||''} ${s.description||''}`.toLowerCase();const m=[[/pan\b/,1],[/voter|election|epic/,2],[/ayushman/,3],[/\babha\b|digital health/,4],[/divyang|udid|disabil/,5],[/aadhaar|identity/,0],[/ladki|maharashtra|maha yoj|aaple/,7],[/women|child|mahila|bal/,9],[/ration|food/,11],[/income|caste|domicile|non.?creamy|nationality/,12],[/land|7\/12|8a|bhulekh|revenue/,13],[/agri|farmer|kisan|crop|pm.?kisan/,14],[/rto|driving|licen[cs]e|vehicle|challan/,15],[/scholar|education|student|admission|exam|migration/,16],[/e.?shram|worker|labour|labor/,18],[/employment|job|rojgar/,17],[/epfo|\bpf\b|uan/,21],[/pension|jeevan pramaan|social security/,10],[/bank|financial|loan|aeps/,19],[/insurance|pmjjby|pmsby/,20],[/passport|travel|visa|ticket/,22],[/police|verification|character/,23],[/gst|udyam|msme|business|shop act|gumasta|fssai|trade/,24],[/bill|recharge|electric|gas|water|utility/,25],[/certificate|birth|death|marriage|affidavit/,6],[/form|application|online/,26],[/photo|print|xerox|laminat|scan|document|pdf|typing/,27],[/maha e|aaple sarkar/,28],[/scheme|government/,8]];for(const [r,i] of m)if(r.test(t))return SERVICE_CATEGORIES[i];return SERVICE_CATEGORIES[29]}
export function categoryCardHTML(active='all'){return [`<button type="button" class="svc-cat-card ${active==='all'?'active':''}" data-cat="all">All Categories</button>`,...SERVICE_CATEGORIES.map((n,i)=>`<button type="button" class="svc-cat-card ${['yellow','pink','red','blue','black','white'][i%6]} ${active===n?'active':''}" data-cat="${n}">${n}</button>`)].join('')}
export function installCategoryCardStyles(){
  if(document.getElementById('svcCategoryStyles'))return;
  const s=document.createElement('style');
  s.id='svcCategoryStyles';
  s.textContent=`
  .svc-cat-wrap{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(125px,1fr));
    gap:8px;
    margin:12px 0 18px
  }
  .svc-cat-card{
    position:relative;
    overflow:hidden;
    border:1px solid rgba(15,23,42,.12);
    border-radius:11px;
    padding:8px 7px;
    min-height:44px;
    font:800 10.5px/1.22 inherit;
    letter-spacing:.05px;
    cursor:pointer;
    white-space:normal;
    box-shadow:0 3px 10px rgba(15,23,42,.12);
    transition:transform .16s ease,box-shadow .16s ease,filter .16s ease
  }
  .svc-cat-card:before{
    content:"";
    position:absolute;
    inset:0 0 auto 0;
    height:3px;
    background:rgba(255,255,255,.58)
  }
  .svc-cat-card:hover{
    transform:translateY(-2px);
    box-shadow:0 7px 16px rgba(15,23,42,.18);
    filter:saturate(1.08)
  }
  .svc-cat-card.active{
    outline:3px solid #16a34a;
    outline-offset:2px;
    box-shadow:0 0 0 1px #fff,0 8px 18px rgba(22,163,74,.25)
  }
  .svc-cat-card.yellow{background:linear-gradient(135deg,#fff7b2,#facc15 72%,#eab308);color:#422006}
  .svc-cat-card.pink{background:linear-gradient(135deg,#fce7f3,#ec4899 64%,#be185d);color:#fff}
  .svc-cat-card.red{background:linear-gradient(135deg,#fecaca,#ef4444 62%,#b91c1c);color:#fff}
  .svc-cat-card.blue{background:linear-gradient(135deg,#dbeafe,#2563eb 62%,#1e40af);color:#fff}
  .svc-cat-card.black{background:linear-gradient(135deg,#475569,#111827 58%,#020617);color:#fff}
  .svc-cat-card.white{background:linear-gradient(135deg,#ffffff,#f8fafc 58%,#e2e8f0);color:#0f172a;border-color:#cbd5e1}
  .svc-cat-card:nth-child(7n+1){background:linear-gradient(135deg,#dcfce7,#22c55e 62%,#15803d);color:#fff}
  .svc-cat-card:nth-child(7n+2){background:linear-gradient(135deg,#fef9c3,#f59e0b 64%,#d97706);color:#3f2300}
  .svc-cat-card:nth-child(7n+3){background:linear-gradient(135deg,#fce7f3,#db2777 64%,#9d174d);color:#fff}
  .svc-cat-card:nth-child(7n+4){background:linear-gradient(135deg,#fee2e2,#dc2626 64%,#991b1b);color:#fff}
  .svc-cat-card:nth-child(7n+5){background:linear-gradient(135deg,#dbeafe,#1d4ed8 64%,#1e3a8a);color:#fff}
  .svc-cat-card:nth-child(7n+6){background:linear-gradient(135deg,#374151,#111827 64%,#000);color:#fff}
  .svc-cat-card:nth-child(7n){background:linear-gradient(135deg,#fff,#f1f5f9 64%,#cbd5e1);color:#111827}
  @media(max-width:640px){
    .svc-cat-wrap{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
    .svc-cat-card{font-size:9.5px;padding:6px 4px}
  }`;
  document.head.appendChild(s)
}
