(()=>{
'use strict';
const HUB='level-up-career-quest-hub-v1';
function readHub(){try{return JSON.parse(localStorage.getItem(HUB)||'{}')}catch{return{}}}
function writeDay(day){if(!(day>=6&&day<=10))return false;const h=readHub();h.electrician=h.electrician||{};const cur=Number(h.electrician.day||h.electrician.currentDay||0);if(cur<day){h.electrician.day=day;h.electrician.currentDay=day;h.electrician.current_day=day;h.electrician.completedDays=Math.max(Number(h.electrician.completedDays||0),day-1);h.electrician.completed_days=h.electrician.completedDays;h.electrician.totalDays=10;h.electrician.total_days=10;localStorage.setItem(HUB,JSON.stringify(h));window.dispatchEvent(new Event('storage'));}return true}
function detect(){const f=document.getElementById('experience');let d;try{d=f?.contentDocument}catch{return false}if(!d?.body)return false;const t=(d.body.innerText||'').replace(/\s+/g,' ');let m=t.match(/Day\s*(6|7|8|9|10)\s*[•\/\-]/i)||t.match(/Current progression:\s*Day\s*(6|7|8|9|10)/i);if(m)return writeDay(Number(m[1]));return false}
function init(){const f=document.getElementById('experience');if(!f)return;f.addEventListener('load',()=>{setTimeout(detect,150);setTimeout(detect,650)});let tries=0;const timer=setInterval(()=>{tries++;if(detect()||tries>20)clearInterval(timer)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();