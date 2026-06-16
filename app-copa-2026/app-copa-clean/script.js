const groups = {
  A:[['Mexico','mx'],['South Africa','za'],['South Korea','kr'],['Czechia','cz']],
  B:[['Canada','ca'],['Switzerland','ch'],['Bosnia and Herzegovina','ba'],['Qatar','qa']],
  C:[['Brazil','br'],['Morocco','ma'],['Scotland','gb-sct'],['Haiti','ht']],
  D:[['USA','us'],['Paraguay','py'],['Türkiye','tr'],['Australia','au']],
  E:[['Germany','de'],['Curaçao','cw'],['Côte d’Ivoire','ci'],['Ecuador','ec']],
  F:[['Netherlands','nl'],['Sweden','se'],['Tunisia','tn'],['Japan','jp']],
  G:[['Belgium','be'],['Iran','ir'],['New Zealand','nz'],['Egypt','eg']],
  H:[['Uruguay','uy'],['Cape Verde','cv'],['Spain','es'],['Saudi Arabia','sa']],
  I:[['France','fr'],['Senegal','sn'],['Norway','no'],['Iraq','iq']],
  J:[['Argentina','ar'],['Algeria','dz'],['Austria','at'],['Jordan','jo']],
  K:[['Portugal','pt'],['Uzbekistan','uz'],['Colombia','co'],['DR Congo','cd']],
  L:[['England','gb-eng'],['Croatia','hr'],['Ghana','gh'],['Panama','pa']]
};

const els = {
  groupsGrid: document.getElementById('groupsGrid'),
  matchesList: document.getElementById('matchesList'),
  generalTable: document.getElementById('generalTable'),
  bracket: document.getElementById('bracket'),
  championName: document.getElementById('championName'),
  fillQualified: document.getElementById('fillQualified'),
  clearBracket: document.getElementById('clearBracket'),
  resetBtn: document.getElementById('resetBtn'),
  cloudStatus: document.getElementById('cloudStatus')
};

const flag = c => `https://flagcdn.com/w80/${c}.png`;
const matches = [];
Object.entries(groups).forEach(([g, teams]) => {
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ id: `${g}-${i}-${j}`, group: g, home: teams[i], away: teams[j] });
    }
  }
});

let state = JSON.parse(localStorage.getItem('copaState') || '{}');
let bracketState = JSON.parse(localStorage.getItem('bracketState') || '{}');
let saveTimer = null;
let applyingCloudUpdate = false;
let cloudStarted = false;

const rounds = [['32 avos',16], ['Oitavas',8], ['Quartas',4], ['Semifinal',2], ['Final',1]];

function appPayload(){
  return {
    groups,
    matches,
    copaState: state,
    bracketState,
    updatedAtLocal: new Date().toISOString()
  };
}

function updateCloudStatus(text, type=''){
  if(!els.cloudStatus) return;
  els.cloudStatus.textContent = text;
  els.cloudStatus.className = `cloud-status ${type}`.trim();
}

function save(){
  localStorage.setItem('copaState', JSON.stringify(state));
  localStorage.setItem('bracketState', JSON.stringify(bracketState));
  saveCloud();
}

function saveCloud(immediate=false){
  if(applyingCloudUpdate || !window.cloudStore) return;
  clearTimeout(saveTimer);
  const doSave = () => {
    window.cloudStore.save(appPayload()).then(() => {
      updateCloudStatus('Conectado ao Firebase — dados salvos na nuvem', 'ok');
    }).catch(err => {
      console.error(err);
      updateCloudStatus('Falha ao salvar na nuvem — salvo localmente', 'warn');
    });
  };
  if(immediate) doSave();
  else saveTimer = setTimeout(doSave, 400);
}

function emptyStats(){ return {j:0,v:0,e:0,d:0,gp:0,gc:0,sg:0,pts:0}; }

function calc(){
  const stats = {};
  Object.entries(groups).forEach(([g, ts]) => ts.forEach(t => stats[t[0]] = {...emptyStats(), group:g, code:t[1]}));
  matches.forEach(m => {
    const r = state[m.id];
    if(!r || r.h === '' || r.a === '' || r.h === undefined || r.a === undefined) return;
    const h = Number(r.h), a = Number(r.a);
    if(Number.isNaN(h) || Number.isNaN(a)) return;
    const H = stats[m.home[0]], A = stats[m.away[0]];
    H.j++; A.j++;
    H.gp += h; H.gc += a; A.gp += a; A.gc += h;
    H.sg = H.gp - H.gc; A.sg = A.gp - A.gc;
    if(h > a){ H.v++; A.d++; H.pts += 3; }
    else if(a > h){ A.v++; H.d++; A.pts += 3; }
    else { H.e++; A.e++; H.pts++; A.pts++; }
  });
  return stats;
}

function sortedTeams(list, stats){
  return [...list].sort((a,b) => stats[b[0]].pts - stats[a[0]].pts || stats[b[0]].sg - stats[a[0]].sg || stats[b[0]].gp - stats[a[0]].gp || a[0].localeCompare(b[0]));
}

function renderGroups(){
  const stats = calc();
  els.groupsGrid.innerHTML = Object.entries(groups).map(([g, ts]) => {
    const ordered = sortedTeams(ts, stats);
    return `<div class="group-card"><div class="group-head"><h3>Grupo ${g}</h3><span class="badge">4 seleções</span></div><div class="team-row header"><span></span><span>Seleção</span><span>J</span><span>SG</span><span>GP</span><span>GC</span><span>PTS</span></div>${ordered.map(t => { const s = stats[t[0]]; return `<div class="team-row"><img class="flag" src="${flag(t[1])}" onerror="this.style.display='none'"><span class="team-name">${t[0]}</span><span class="stat">${s.j}</span><span class="stat">${s.sg}</span><span class="stat">${s.gp}</span><span class="stat">${s.gc}</span><span class="stat">${s.pts}</span></div>`; }).join('')}</div>`;
  }).join('');
  renderGeneral();
}

function renderMatches(){
  els.matchesList.innerHTML = matches.map(m => {
    const r = state[m.id] || {h:'', a:''};
    return `<div class="match-card"><div class="home"><div class="team-mini"><span>${m.home[0]}</span><img class="flag" src="${flag(m.home[1])}"></div></div><input type="number" min="0" value="${r.h ?? ''}" data-id="${m.id}" data-side="h"><span class="vs">x</span><input type="number" min="0" value="${r.a ?? ''}" data-id="${m.id}" data-side="a"><div class="away"><div class="team-mini"><img class="flag" src="${flag(m.away[1])}"><span>${m.away[0]}</span></div></div></div>`;
  }).join('');
  document.querySelectorAll('#matchesList input').forEach(i => i.oninput = e => {
    state[e.target.dataset.id] = state[e.target.dataset.id] || {h:'', a:''};
    state[e.target.dataset.id][e.target.dataset.side] = e.target.value;
    save();
    renderGroups();
  });
}

function renderGeneral(){
  const stats = calc();
  const all = Object.keys(stats).sort((a,b) => stats[b].pts - stats[a].pts || stats[b].sg - stats[a].sg || stats[b].gp - stats[a].gp || a.localeCompare(b));
  els.generalTable.innerHTML = all.map((n,i) => { const s = stats[n]; return `<tr><td>${i+1}</td><td><span class="team-mini"><img class="flag" src="${flag(s.code)}">${n}</span></td><td>${s.group}</td><td>${s.j}</td><td>${s.v}</td><td>${s.e}</td><td>${s.d}</td><td>${s.sg}</td><td>${s.pts}</td></tr>`; }).join('');
}

function getAllTeams(){ return Object.values(groups).flat(); }
function options(selected=''){ return '<option value="">Escolha</option>' + getAllTeams().map(t => `<option ${selected === t[0] ? 'selected' : ''} value="${t[0]}">${t[0]}</option>`).join(''); }
function gameWinner(r,g){
  const a = bracketState[`${r}-${g}-a`] || '', b = bracketState[`${r}-${g}-b`] || '';
  const sa = bracketState[`${r}-${g}-sa`], sb = bracketState[`${r}-${g}-sb`];
  if(a && b && sa !== '' && sb !== '' && sa !== undefined && sb !== undefined && Number(sa) !== Number(sb)) return Number(sa) > Number(sb) ? a : b;
  return '';
}
function advance(){
  rounds.forEach((round, ri) => {
    if(ri === rounds.length - 1) return;
    for(let g=0; g<round[1]; g++){
      const w = gameWinner(ri,g);
      if(w){ const nextGame = Math.floor(g/2), slot = g % 2 === 0 ? 'a' : 'b'; bracketState[`${ri+1}-${nextGame}-${slot}`] = w; }
    }
  });
}
function renderBracket(){
  els.bracket.innerHTML = rounds.map(([name,count], r) => `<div class="round"><h3>${name}</h3>${Array.from({length: count}, (_,g) => { const w = gameWinner(r,g); return `<div class="game"><div class="select-line"><select data-k="${r}-${g}-a">${options(bracketState[`${r}-${g}-a`])}</select><input type="number" min="0" value="${bracketState[`${r}-${g}-sa`] ?? ''}" data-k="${r}-${g}-sa"></div><div class="select-line"><select data-k="${r}-${g}-b">${options(bracketState[`${r}-${g}-b`])}</select><input type="number" min="0" value="${bracketState[`${r}-${g}-sb`] ?? ''}" data-k="${r}-${g}-sb"></div><div class="winner">${w ? 'Avança: '+w : 'Aguardando placar'}</div></div>`; }).join('')}</div>`).join('');
  document.querySelectorAll('#bracket select,#bracket input').forEach(el => el.oninput = e => {
    bracketState[e.target.dataset.k] = e.target.value;
    advance();
    save();
    renderBracket();
  });
  els.championName.textContent = gameWinner(4,0) || 'Campeão';
}

function renderAll(){
  renderMatches();
  renderGroups();
  renderBracket();
}

els.fillQualified.onclick = () => {
  const stats = calc();
  let qualified = [];
  Object.entries(groups).forEach(([g, ts]) => qualified.push(...sortedTeams(ts, stats).slice(0,2)));
  const thirds = Object.entries(groups).map(([g, ts]) => sortedTeams(ts, stats)[2]).sort((a,b) => stats[b[0]].pts - stats[a[0]].pts || stats[b[0]].sg - stats[a[0]].sg).slice(0,8);
  qualified = [...qualified, ...thirds].slice(0,32);
  bracketState = {};
  qualified.forEach((t,i) => bracketState[`0-${Math.floor(i/2)}-${i % 2 ? 'b' : 'a'}`] = t[0]);
  save();
  renderBracket();
};

els.clearBracket.onclick = () => { bracketState = {}; localStorage.removeItem('bracketState'); saveCloud(true); renderBracket(); };
els.resetBtn.onclick = () => { state = {}; localStorage.removeItem('copaState'); saveCloud(true); renderMatches(); renderGroups(); };

document.querySelectorAll('.tab').forEach(btn => btn.onclick = () => {
  document.querySelectorAll('.tab,.panel').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
});

async function startCloudSync(){
  if(cloudStarted || !window.cloudStore) return;
  cloudStarted = true;
  try{
    const cloudData = await window.cloudStore.load();
    if(cloudData){
      applyingCloudUpdate = true;
      state = cloudData.copaState || {};
      bracketState = cloudData.bracketState || {};
      localStorage.setItem('copaState', JSON.stringify(state));
      localStorage.setItem('bracketState', JSON.stringify(bracketState));
      renderAll();
      applyingCloudUpdate = false;
    }
    saveCloud(true); // sobe grupos, jogos e estado inicial mesmo sem placares
    window.cloudStore.listen((cloudData) => {
      applyingCloudUpdate = true;
      state = cloudData.copaState || {};
      bracketState = cloudData.bracketState || {};
      localStorage.setItem('copaState', JSON.stringify(state));
      localStorage.setItem('bracketState', JSON.stringify(bracketState));
      renderAll();
      applyingCloudUpdate = false;
    });
  }catch(err){
    console.error(err);
    updateCloudStatus('Erro ao carregar nuvem — usando local', 'warn');
  }
}

renderAll();
window.addEventListener('cloud-ready', startCloudSync);
setTimeout(startCloudSync, 500);
