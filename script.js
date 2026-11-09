'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
$('#year').textContent = new Date().getFullYear();
const setHeader=()=>$('.header').classList.toggle('scrolled',window.scrollY>30);
window.addEventListener('scroll',setHeader,{passive:true});setHeader();
const nav = $('#nav');
const navToggle = $('#nav-toggle');
function closeNav(){nav.classList.remove('open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Open menu');}
navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeNav();});
window.matchMedia('(min-width:821px)').addEventListener('change',e=>{if(e.matches)closeNav();});
// This remains the same read-only endpoint used by the original Netlify site.
// The private preview forwards GETs to the official API server-side.
const endpoint = '/.netlify/functions/leaderboard';
const state = {period:'all',players:[],limit:10,query:'',requestId:0,controller:null,loading:false};
const fmt = n => Number.isFinite(Number(n)) ? Math.max(0,Number(n)).toLocaleString('en-US') : '—';
const status = $('#ranking-status');
const body = $('#ranking-body');
function cell(value,cls){const td=document.createElement('td');td.textContent=value;if(cls)td.className=cls;return td;}
function showEmpty(message){body.replaceChildren();const tr=document.createElement('tr');const td=cell(message,'empty-state');td.colSpan=5;tr.append(td);body.append(tr);}
function renderRows(){
 const query=state.query.trim().toLocaleLowerCase('en');
 const ranked=state.players.map((player,i)=>({player,rank:i+1}));
 const filtered=query?ranked.filter(({player})=>String(player.displayName||'').toLocaleLowerCase('en').includes(query)):ranked;
 const visible=filtered.slice(0,state.limit);
 body.replaceChildren();
 if(!visible.length){showEmpty(query?'No commander found in the top 100.':'No scores recorded for this period.');}
 for(const {player,rank} of visible){
  const tr=document.createElement('tr');if(rank<=3)tr.className='rank-top';
  const rankCell=cell(String(rank).padStart(2,'0'));tr.append(rankCell);
  const nameCell=document.createElement('td');const mark=document.createElement('span');mark.className='commander-mark';mark.setAttribute('aria-hidden','true');mark.textContent=String(player.displayName||'C').slice(0,2).toUpperCase();nameCell.append(mark,document.createTextNode(String(player.displayName||'Commander')));tr.append(nameCell);
  const monthly=state.period==='month';tr.append(cell(fmt(monthly?player.robotsDestroyedMonth:player.robotsDestroyedTotal)),cell(fmt(monthly?player.runsCountMonth:player.runsCount)),cell(fmt(monthly?player.bestRunMonth:player.bestRun)));body.append(tr);
 }
 $('#ranking-count').textContent=query?`${filtered.length} result${filtered.length!==1?'s':''} in the top ${state.players.length}`:`${visible.length} of ${state.players.length} commander${state.players.length!==1?'s':''}`;
 $('#show-more').hidden=visible.length>=filtered.length;
 $('#show-more').firstChild.textContent=`Show ${Math.min(20,filtered.length-visible.length)} more `;
}
function selectPeriod(period){
 state.period=period;state.limit=10;
 $$('[data-period]').forEach(tab=>{const active=tab.dataset.period===period;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 $('#ranking-panel').setAttribute('aria-labelledby','tab-'+period);
 $('#ranking-period').textContent=period==='all'?'TOP 100 / ALL TIME':'TOP 100 / THIS MONTH';
 return loadRanking();
}
async function loadRanking(){
 state.controller?.abort();const controller=new AbortController();state.controller=controller;const requestId=++state.requestId;
 state.loading=true;$('#refresh-ranking').disabled=true;$('#ranking-panel').setAttribute('aria-busy','true');status.className='';status.textContent='Connecting to the official leaderboard…';showEmpty('Loading official scores…');$('#show-more').hidden=true;$('#ranking-count').textContent='No sample scores.';
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(`${endpoint}?period=${state.period}&limit=100`,{headers:{Accept:'application/json'},cache:'no-store',signal:controller.signal});
  if(!response.ok)throw new Error('The service is not responding');
  const data=await response.json();
  if(data.ok!==true||!Array.isArray(data.topPlayers))throw new Error('Invalid response');
  if(requestId!==state.requestId)return;
  state.players=data.topPlayers.slice(0,100);
  $('#global-total').textContent=fmt(data.totalRobotsDestroyed);$('#monthly-total').textContent=fmt(data.totalRobotsDestroyedMonth);
  const checked=new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit'}).format(new Date());
  status.textContent=`Official scores · updated at ${checked}`;
  if(state.period==='month'&&/^\d{4}-\d{2}$/.test(data.monthKey)){const month=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(data.monthKey+'-01T00:00:00Z'));$('#ranking-period').textContent='TOP 100 / '+month.toLocaleUpperCase('en');}
  renderRows();
 }catch(error){
  if(requestId!==state.requestId)return;
  state.players=[];$('#global-total').textContent='—';$('#monthly-total').textContent='—';status.className='error';status.textContent='Connection unavailable. Try the ↻ refresh button.';showEmpty('The official leaderboard is temporarily unavailable. No sample scores are shown.');$('#ranking-count').textContent='You can also check scores on the official website.';
 }finally{clearTimeout(timeout);if(requestId===state.requestId){state.loading=false;$('#refresh-ranking').disabled=false;$('#ranking-panel').setAttribute('aria-busy','false');}}
}
$$('[data-period]').forEach((tab,i,tabs)=>{
 tab.addEventListener('click',()=>{if(tab.dataset.period!==state.period)selectPeriod(tab.dataset.period);});
 tab.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();selectPeriod(tabs[next].dataset.period);});
});
$('#refresh-ranking').addEventListener('click',loadRanking);
$('#player-search').addEventListener('input',e=>{state.query=e.target.value;state.limit=10;if(!state.loading)renderRows();});
$('#show-more').addEventListener('click',()=>{state.limit+=20;renderRows();});
loadRanking();
