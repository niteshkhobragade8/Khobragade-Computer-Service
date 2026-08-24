import { db } from "./firebase-config.js";
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
let rows = [];
const pageNames = { home: "Home", services: "Services", yojana: "Yojana", divyang: "Divyang", documents: "Documents", contact: "Contact" };
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function msg(text,type="info"){const e=$("seoMessage");if(e){e.textContent=text;e.className="settings-message "+type}}
function clearForm(){const key=$("seoPageSelect")?.value||"home"; ["seoTitle","seoDescription","seoKeywords","seoImage","seoCanonical"].forEach(id=>{if($(id))$(id).value=""}); if($("seoPageSelect"))$("seoPageSelect").value=key; msg("Form cleared. Existing saved SEO delete nahi hua.","info")}
function loadSelected(){const key=$("seoPageSelect")?.value||"home";const x=rows.find(r=>r.id===key)||{}; if($("seoTitle"))$("seoTitle").value=x.title||"";if($("seoDescription"))$("seoDescription").value=x.description||"";if($("seoKeywords"))$("seoKeywords").value=x.keywords||"";if($("seoImage"))$("seoImage").value=x.image||"";if($("seoCanonical"))$("seoCanonical").value=x.canonical||""}
async function saveSeo(){const key=$("seoPageSelect")?.value||"home";const data={page:key,title:$("seoTitle")?.value.trim()||"",description:$("seoDescription")?.value.trim()||"",keywords:$("seoKeywords")?.value.trim()||"",image:$("seoImage")?.value.trim()||"",canonical:$("seoCanonical")?.value.trim()||"",updatedAt:serverTimestamp()};await setDoc(doc(db,"seoSettings",key),data,{merge:true});msg(`${pageNames[key]||key} SEO saved successfully.`,"success")}
function render(){const box=$("seoList");if(!box)return;const ordered=Object.keys(pageNames).map(k=>rows.find(r=>r.id===k)||{id:k,page:k});box.innerHTML=ordered.map(x=>`<article class="content-card"><h3>${esc(pageNames[x.id]||x.id)}</h3><p><b>Title:</b> ${esc(x.title||"Not set")}</p><p><b>Description:</b> ${esc(x.description||"Not set")}</p>${x.image?`<img src="${esc(x.image)}" alt="SEO" style="width:100%;max-height:120px;object-fit:cover;border-radius:12px" loading="lazy">`:""}<div class="card-actions"><button class="action-btn edit" data-page-key="${x.id}">✏ Edit</button></div></article>`).join("")}
$("saveSeo")?.addEventListener("click",()=>saveSeo().catch(e=>msg(e.message,"error")));
$("resetSeoForm")?.addEventListener("click",clearForm);
$("seoPageSelect")?.addEventListener("change",loadSelected);
$("seoList")?.addEventListener("click",e=>{const b=e.target.closest("button[data-page-key]");if(!b)return;if($("seoPageSelect"))$("seoPageSelect").value=b.dataset.pageKey;loadSelected();document.querySelector("#seoPage .manager-form")?.scrollIntoView({behavior:"smooth",block:"start"})});
onSnapshot(collection(db,"seoSettings"),s=>{rows=s.docs.map(d=>({id:d.id,...d.data()}));render();loadSelected()},e=>msg(e.message,"error"));
