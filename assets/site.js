import {inject} from './analytics.mjs';
const KEY='treolympus-privacy-v1';
const affiliate='https://stake.com/?c=NE3yHgEO';
const incoming=new URLSearchParams(location.search),params=new URLSearchParams();
for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','clickid','pa_campaign','pa_zone']){const value=incoming.get(key);if(value&&/^[a-zA-Z0-9_.{}$:-]{1,180}$/.test(value))params.set(key,value);}
const privateSignal=navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
let preference=null,started=false;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Date.now()-saved.at<180*86400000)preference=saved.value;}catch{}
if(privateSignal)preference='no';
function startAnalytics(){
 if(started||preference!=='yes'||privateSignal)return;
 started=true;
 inject({mode:'production',beforeSend:event=>{
  if(preference!=='yes'||privateSignal)return null;
  const safe=new URL(event.url,location.origin),utm=new URLSearchParams();
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']){const value=safe.searchParams.get(key);if(value&&/^[a-z0-9_-]{1,80}$/i.test(value))utm.set(key,value);}
  safe.search=utm.toString();safe.hash='';return {...event,url:safe.href};
 }});
}
const panel=document.querySelector('.consent');
function choose(value){preference=value;try{localStorage.setItem(KEY,JSON.stringify({value,at:Date.now()}));}catch{}panel.hidden=true;const status=document.getElementById('privacy-status');status.textContent=status.dataset.saved;if(value==='yes')startAnalytics();}
for(const button of document.querySelectorAll('[data-consent]'))button.addEventListener('click',()=>choose(button.dataset.consent));
for(const button of document.querySelectorAll('[data-privacy-open]'))button.addEventListener('click',()=>{panel.hidden=false;panel.querySelector('button').focus();});
if(!preference&&!document.body.dataset.outbound)panel.hidden=false;
startAnalytics();
for(const link of document.querySelectorAll('[data-internal]')){const dest=new URL(link.href);dest.search=params.toString();link.href=dest.href;}
for(const link of document.querySelectorAll('[data-affiliate]'))link.addEventListener('click',event=>{
 // Count a real handoff page on the free analytics plan. This is not a signup or deposit.
 if(preference!=='yes'||privateSignal||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();const prefix=document.body.dataset.lang==='fr'?'/fr':'';
 location.assign(`${prefix}/out/${document.body.dataset.angle}${params.size?'?'+params:''}`);
});
if(document.body.dataset.outbound){
 let leaving=false;const leave=()=>{if(!leaving){leaving=true;location.replace(affiliate);}};
 const script=document.querySelector('script[src="/_vercel/insights/script.js"]');
 if(script)script.addEventListener('load',()=>setTimeout(leave,200),{once:true});
 setTimeout(leave,preference==='yes'?900:50);
}
