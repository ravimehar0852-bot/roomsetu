import { auth, db, A, F, esc } from "./app.js";
export const AREAS=["Talwandi","Mahaveer Nagar","Rajeev Gandhi Nagar","Landmark City","Kunhadi","Vigyan Nagar","Jawahar Nagar","Dadabari"];
export const TYPES=["Single Room","Double Sharing","Triple Sharing","PG","Hostel","1 BHK","2 BHK","Family Rental"];
export const toast=m=>{const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)};
let favs=new Set(),uid=null;
export const inr=n=>"₹"+Number(n||0).toLocaleString("en-IN");
export function card(l){
 const img=(l.photos&&l.photos[0])?`<img loading="lazy" src="${esc(l.photos[0])}" alt="${esc(l.title)}">`:`<div class="ph"></div>`;
 return `<article class="card prop">${img}<div class="b"><span class="tag">${esc(l.propertyType||l.roomTypeLabel||"Room")}</span><span class="tag">${l.availability==="available"?"Available":"Booked"}</span>
 <h3>${esc(l.title)}</h3><div class="muted">${esc(l.area||"")}${l.city?", "+esc(l.city):""}</div>
 <div class="rent">${inr(l.monthlyRent)}<span class="muted"> /month</span></div>${l.securityDeposit!=null?`<div class="muted">Deposit ${inr(l.securityDeposit)}</div>`:""}
 <div class="row"><a class="krf-btn fill" href="room-details.html?id=${encodeURIComponent(l.id)}">Details</a><button class="krf-btn" data-fav="${esc(l.id)}">${favs.has(l.id)?"♥ Saved":"♡ Save"}</button></div></div></article>`}
export async function loadFavs(){favs=new Set();if(!uid)return;try{const s=await F.getDocs(F.query(F.collection(db,"favorites"),F.where("uid","==",uid)));s.forEach(d=>favs.add(d.data().listingId))}catch(e){console.warn(e)}}
export function bindFav(root){root.onclick=async e=>{const b=e.target.closest("[data-fav]");if(!b)return;
 if(!uid){toast("Save karne ke liye login karein");setTimeout(()=>location.href="login.html?next="+encodeURIComponent(location.pathname.split("/").pop()),900);return}
 const id=b.dataset.fav,ref=F.doc(db,"favorites",uid+"_"+id);
 try{if(favs.has(id)){await F.deleteDoc(ref);favs.delete(id);b.textContent="♡ Save"}else{await F.setDoc(ref,{uid,listingId:id,createdAt:F.serverTimestamp()});favs.add(id);b.textContent="♥ Saved"}}catch(err){toast("Save nahi ho paya, dobara try karein")}}}
export async function fetchApproved(f={}){
 const c=[F.where("status","==","approved"),F.where("availability","==","available")];
 if(f.area)c.push(F.where("area","==",f.area));
 if(f.propertyType)c.push(F.where("propertyType","==",f.propertyType));
 if(f.suitableFor)c.push(F.where("suitableFor","==",f.suitableFor));
 if(f.furnishing)c.push(F.where("furnishing","==",f.furnishing));
 c.push(F.limit(f.max||60));
 const s=await F.getDocs(F.query(F.collection(db,"listings"),...c));
 let r=s.docs.map(d=>({id:d.id,...d.data()}));
 if(f.min)r=r.filter(x=>x.monthlyRent>=f.min);if(f.maxRent)r=r.filter(x=>x.monthlyRent<=f.maxRent);
 if(f.sort==="low")r.sort((a,b)=>a.monthlyRent-b.monthlyRent);if(f.sort==="high")r.sort((a,b)=>b.monthlyRent-a.monthlyRent);
 return r}
export function authReady(){return new Promise(res=>{const u=A.onAuthStateChanged(auth,async x=>{u();uid=x?x.uid:null;await loadFavs();res(x)})})}
export function show(el,list,emptyMsg){el.innerHTML=list.length?list.map(card).join(""):`<div class="empty" style="grid-column:1/-1"><b>Koi room nahi mila</b>${emptyMsg||"Filters change karke dobara try karein."}</div>`;bindFav(el)}
