import { mkdir, writeFile } from 'node:fs/promises';
import { pinCard } from '../vendor/readme-cards/cards/pin.js';
import { resolveTheme } from '../vendor/readme-cards/theme.js';
import { locale } from '../vendor/readme-cards/i18n.js';
import { escapeXml as esc } from '../vendor/readme-cards/text.js';

const owner = 'RosTGs';
const out = new URL('../assets/', import.meta.url);
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'RosTGs-paper-workshop' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function api(path) {
  const response = await fetch(`https://api.github.com/${path}`, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${path}`);
  return response.json();
}
const selected = [
  { name: 'helltaker-lilith', title: 'ИСТОРИЯ / 01', description: 'Лилит в Helltaker: свой персонаж, танцевальная анимация и русская история.' },
  { name: 'DonationAlertsPluginUE5', title: 'ИНСТРУМЕНТ / 02', description: 'События трансляции становятся игровыми действиями через подсистемы Unreal Engine и Blueprint.' },
  { name: 'vovka-pet', title: 'ПЕРСОНАЖ / 03', description: 'Вовка — анимированный питомец Codex. Движения и эмоции собраны в готовый пакет.' },
  { name: 'litsedey', title: 'АНИМАЦИЯ / 04', description: 'Лицедей: слои, деформация сеток и анимация 2D-персонажей. Версия 0.4 — рабочий прототип.' },
];
const repos = [];
for (let page = 1; ; page++) {
  const batch = await api(`users/${owner}/repos?type=owner&per_page=100&page=${page}`);
  repos.push(...batch.filter(r => r.private === false));
  if (batch.length < 100) break;
}
const details = await Promise.all(selected.map(p => api(`repos/${owner}/${p.name}`)));
if (details.some(r => r.private)) throw new Error('Featured projects must be public');
const ink = '#38342f', red = '#a74336';
function paper(w,h,title,body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#bbc7c7" stroke-opacity=".34" stroke-width=".6"/></pattern></defs><rect width="100%" height="100%" fill="#f5efe3"/><rect width="100%" height="100%" fill="url(#grid)"/><rect x="10" y="10" width="${w-20}" height="${h-20}" fill="none" stroke="#8f9188" stroke-width=".8"/><path d="M4 20H26M20 4V26M${w-26} ${h-20}h22M${w-20} ${h-26}v22" stroke="#8f9188" fill="none"/><g fill="${ink}" font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>`;
}
function label(x,y,text,size=14,fill=ink) { return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${esc(String(text))}</text>`; }
const files = [];
for (let i=0;i<selected.length;i++) {
  const p=selected[i], r=details[i];
  const q=new URLSearchParams({locale:'ru',card_width:'600',description_lines_count:'3',bg_color:'00000000',title_color:'38342f',text_color:'4b4942',muted_color:'6b6860',icon_color:'a74336',accent_color:'a74336',hide_border:'true',disable_animations:'true',border_radius:'0'});
  const theme=resolveTheme(q,'pin');
  const inner=pinCard({repo:{name:r.name,full:r.full_name,description:p.description,stars:r.stargazers_count,forks:r.forks_count,archived:r.archived,template:r.is_template,lang:r.language?{name:r.language,color:red}:null}},theme,locale(q),q);
  const content=inner.replace(/<title[^>]*>[\s\S]*?<\/title>/,'').replace(/ aria-labelledby="t"/,'');
  files.push([`${p.name}.svg`,paper(900,280,p.description,
    label(36,42,p.title,13,red)+label(650,42,'ROSTGS / WORKSHOP',12)+
    `<svg x="24" y="58" width="852" height="198" viewBox="0 0 600 155">${content.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`+
    `<path d="M36 53H864" stroke="#92968c" stroke-width=".7"/>`)]);
}
const route= ['ИДЕЯ','ПРОТОТИП','ПРОВЕРКА','ПРОЕКТ'];
files.push(['route.svg',paper(900,148,'Маршрут по мастерской: идея, прототип, проверка, проект',
  label(34,35,'ЗАМЕТКА ЛИЛИТ / ОТ ЗАМЫСЛА К РЕЗУЛЬТАТУ',12,red)+
  `<path d="M92 80H810" stroke="#999d95" stroke-dasharray="4 5"/>`+
  route.map((s,i)=>`<circle cx="${92+i*235}" cy="80" r="6" fill="#f5efe3" stroke="${red}"/>`+label(52+i*235,115,s,14)).join('')+
  `<style>@keyframes travel{0%,12%{transform:translateX(0)}30%,42%{transform:translateX(235px)}60%,72%{transform:translateX(470px)}90%,100%{transform:translateX(705px)}}.guide{animation:travel 12s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.guide{animation:none}}</style><circle class="guide" cx="92" cy="80" r="4" fill="${red}"/>`)]);
files.push(['stream-flow.svg',paper(900,160,'Событие зрителя → подсистема → Blueprint → действие в игре',
  label(34,34,'ЛИЛИТ ПОЯСНЯЕТ / КАК ЭТО СВЯЗАНО',12,red)+
  ['Зритель','Подсистема','Blueprint','Игра'].map((s,i)=>{
    const x=34+i*220;
    return `<rect x="${x}" y="61" width="170" height="54" fill="#f5efe3" stroke="#777e77"/>`+label(x+18,94,s,19)+(i<3?`<path d="M${x+177} 88h32m-7-5 7 5-7 5" fill="none" stroke="${red}"/>`:'');
  }).join('')+['СОБЫТИЕ','ПОЛУЧЕНИЕ','ОБРАБОТКА','ДЕЙСТВИЕ'].map((s,i)=>label(34+i*220,140,s,10)).join(''))]);
const languages = [...new Set(repos.map(r=>r.language).filter(Boolean))].sort();
const stars=repos.reduce((n,r)=>n+r.stargazers_count,0);
const forks=repos.reduce((n,r)=>n+r.forks_count,0);
const date=new Date().toISOString().slice(0,10);
files.push(['workshop.svg',paper(900,245,'Публичная мастерская RosTGs: проекты, звёзды, форки и основные языки',
  label(34,36,'ПАСПОРТ МАСТЕРСКОЙ / ПУБЛИЧНЫЙ СНИМОК',12,red)+label(695,36,date,12)+
  [[repos.length,'РЕПОЗИТОРИЕВ'],[stars,'ЗВЁЗД'],[forks,'ФОРКОВ']].map(([n,t],i)=>label(40+i*295,106,n,44)+label(40+i*295,134,t,12)).join('')+
  `<path d="M34 155H866" stroke="#92968c"/>`+label(34,181,'ОСНОВНЫЕ ЯЗЫКИ ПРОЕКТОВ',11,red)+label(34,213,languages.join('  /  ') || 'Мастерская пополняется',16))]);
await mkdir(out,{recursive:true});
for (const [name,svg] of files) await writeFile(new URL(name,out),svg);
console.log(`Built ${files.length} cards using ${repos.length} public repositories.`);
