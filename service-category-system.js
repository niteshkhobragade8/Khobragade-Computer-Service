export const SERVICE_CATEGORIES=["Aadhaar & Identity Services","PAN Card Services","Voter ID & Election Services","Ayushman Bharat & Health Services","ABHA & Digital Health Services","Divyang & UDID Services","Government Certificates","Maharashtra Government Schemes","Central Government Schemes","Women & Child Welfare Schemes","Pension & Social Security Services","Ration Card & Food Services","Income, Caste & Domicile Services","Land Records & Revenue Services","Agriculture & Farmer Services","RTO & Driving Licence Services","Education & Scholarship Services","Employment & Labour Services","e-Shram & Worker Services","Banking & Financial Services","Insurance Services","EPFO, UAN & Pension Services","Passport & Travel Services","Police & Verification Services","Business, GST & MSME Services","Utility Bill & Recharge Services","Online Application & Form Services","Document, Printing & Digital Services","Maha e-Seva & Aaple Sarkar Services","Other Digital Services"];
export function professionalCategory(s={}){const t=`${s.name||''} ${s.category||''} ${s.description||''}`.toLowerCase();const m=[[/pan\b/,1],[/voter|election|epic/,2],[/ayushman/,3],[/\babha\b|digital health/,4],[/divyang|udid|disabil/,5],[/aadhaar|identity/,0],[/ladki|maharashtra|maha yoj|aaple/,7],[/women|child|mahila|bal/,9],[/ration|food/,11],[/income|caste|domicile|non.?creamy|nationality/,12],[/land|7\/12|8a|bhulekh|revenue/,13],[/agri|farmer|kisan|crop|pm.?kisan/,14],[/rto|driving|licen[cs]e|vehicle|challan/,15],[/scholar|education|student|admission|exam|migration/,16],[/e.?shram|worker|labour|labor/,18],[/employment|job|rojgar/,17],[/epfo|\bpf\b|uan/,21],[/pension|jeevan pramaan|social security/,10],[/bank|financial|loan|aeps/,19],[/insurance|pmjjby|pmsby/,20],[/passport|travel|visa|ticket/,22],[/police|verification|character/,23],[/gst|udyam|msme|business|shop act|gumasta|fssai|trade/,24],[/bill|recharge|electric|gas|water|utility/,25],[/certificate|birth|death|marriage|affidavit/,6],[/form|application|online/,26],[/photo|print|xerox|laminat|scan|document|pdf|typing/,27],[/maha e|aaple sarkar/,28],[/scheme|government/,8]];for(const [r,i] of m)if(r.test(t))return SERVICE_CATEGORIES[i];return SERVICE_CATEGORIES[29]}
export function categoryCardHTML(active='all'){
  const all=`<button type="button" class="svc-cat-card svc-cat-all ${active==='all'?'active':''}" data-cat="all"><span class="svc-star">★</span><span>All Categories</span></button>`;
  return [all,...SERVICE_CATEGORIES.map((n,i)=>`<button type="button" class="svc-cat-card svc-c${i+1} ${active===n?'active':''}" data-cat="${n}"><span class="svc-star">★</span><span>${n}</span></button>`)].join('')
}
export function installCategoryCardStyles(){
  if(document.getElementById('svcCategoryStyles'))return;
  const s=document.createElement('style');
  s.id='svcCategoryStyles';
  s.textContent=`
  .svc-cat-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:12px 0 18px}
  .svc-cat-card{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(15,23,42,.15);border-radius:11px;padding:7px 7px;min-height:44px;font:800 10.5px/1.18 inherit;letter-spacing:.05px;cursor:pointer;white-space:normal;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:0 4px 0 rgba(15,23,42,.20),0 7px 14px rgba(15,23,42,.12);transition:transform .14s ease,box-shadow .14s ease,filter .14s ease;text-shadow:0 1px 1px rgba(0,0,0,.15)}
  .svc-cat-card:before{content:"";position:absolute;z-index:-1;inset:0 0 52% 0;background:linear-gradient(180deg,rgba(255,255,255,.34),rgba(255,255,255,0));pointer-events:none}
  .svc-cat-card:hover{transform:translateY(-2px);box-shadow:0 6px 0 rgba(15,23,42,.18),0 10px 18px rgba(15,23,42,.16);filter:saturate(1.08)}
  .svc-cat-card:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(15,23,42,.18),0 4px 8px rgba(15,23,42,.12)}
  .svc-cat-card.active{outline:3px solid #22c55e;outline-offset:2px;box-shadow:0 4px 0 rgba(15,23,42,.18),0 0 0 2px #fff,0 8px 18px rgba(34,197,94,.28)}
  .svc-star{font-size:12px;line-height:1;flex:0 0 auto;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2))}
  .svc-cat-all{background:linear-gradient(135deg,#0f172a,#334155);color:#fff}
  .svc-c1{background:linear-gradient(135deg,#15803d,#22c55e);color:#fff}.svc-c2{background:linear-gradient(135deg,#84cc16,#bef264);color:#1f2937}
  .svc-c3{background:linear-gradient(135deg,#eab308,#fde047);color:#3f2d00}.svc-c4{background:linear-gradient(135deg,#ca8a04,#f59e0b);color:#fff}
  .svc-c5{background:linear-gradient(135deg,#ea580c,#fb923c);color:#fff}.svc-c6{background:linear-gradient(135deg,#f97316,#fdba74);color:#3b1b00}
  .svc-c7{background:linear-gradient(135deg,#dc2626,#f87171);color:#fff}.svc-c8{background:linear-gradient(135deg,#be123c,#fb7185);color:#fff}
  .svc-c9{background:linear-gradient(135deg,#db2777,#f472b6);color:#fff}.svc-c10{background:linear-gradient(135deg,#c026d3,#e879f9);color:#fff}
  .svc-c11{background:linear-gradient(135deg,#9333ea,#c084fc);color:#fff}.svc-c12{background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff}
  .svc-c13{background:linear-gradient(135deg,#4f46e5,#818cf8);color:#fff}.svc-c14{background:linear-gradient(135deg,#1d4ed8,#60a5fa);color:#fff}
  .svc-c15{background:linear-gradient(135deg,#2563eb,#93c5fd);color:#fff}.svc-c16{background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff}
  .svc-c17{background:linear-gradient(135deg,#0891b2,#67e8f9);color:#083344}.svc-c18{background:linear-gradient(135deg,#0f766e,#2dd4bf);color:#fff}
  .svc-c19{background:linear-gradient(135deg,#0d9488,#5eead4);color:#083344}.svc-c20{background:linear-gradient(135deg,#059669,#34d399);color:#fff}
  .svc-c21{background:linear-gradient(135deg,#65a30d,#a3e635);color:#1a2e05}.svc-c22{background:linear-gradient(135deg,#92400e,#d97706);color:#fff}
  .svc-c23{background:linear-gradient(135deg,#78350f,#b45309);color:#fff}.svc-c24{background:linear-gradient(135deg,#7f1d1d,#b91c1c);color:#fff}
  .svc-c25{background:linear-gradient(135deg,#172554,#1e3a8a);color:#fff}.svc-c26{background:linear-gradient(135deg,#334155,#64748b);color:#fff}
  .svc-c27{background:linear-gradient(135deg,#111827,#374151);color:#fff}.svc-c28{background:linear-gradient(135deg,#020617,#18181b);color:#fff}
  .svc-c29{background:linear-gradient(135deg,#94a3b8,#e2e8f0);color:#0f172a;text-shadow:none}.svc-c30{background:linear-gradient(135deg,#ffffff,#f8fafc);color:#111827;border-color:#cbd5e1;text-shadow:none}
  @media(max-width:640px){.svc-cat-wrap{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.svc-cat-card{font-size:9.5px;padding:6px 4px}.svc-star{font-size:11px}}
  `;document.head.appendChild(s)
}
