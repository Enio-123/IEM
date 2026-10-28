// Casca do app: navegação, HUD e roteamento por hash.
import { carregar, S, sequencia, aoMudar, diffDias, hojeStr } from './store.js';
import { carregarIndice } from './qbank.js';
import { ic } from './icons.js';
import { esc } from './ui.js';
import { foco } from './foco.js';
import { APP } from './config.js';

const NAV = [
  { r: 'hoje', rot: 'Hoje', ic: 'house' },
  { r: 'escada', rot: 'Rumo ao 45', ic: 'trending-up' },
  { r: 'questoes', rot: 'Questões', ic: 'list-checks' },
  { r: 'cards', rot: 'Flashcards', ic: 'layers' },
  { r: 'plano', rot: 'Plano', ic: 'calendar-days' },
  { r: 'progresso', rot: 'Progresso', ic: 'bar-chart-2' },
  { sep: true },
  { r: 'metodos', rot: 'Métodos de prova', ic: 'lightbulb' },
  { r: 'foco', rot: 'Foco', ic: 'timer' },
  { r: 'mapas', rot: 'Mapas mentais', ic: 'network' },
  { r: 'ajustes', rot: 'Ajustes', ic: 'settings' },
];
const ABAS = ['hoje', 'escada', 'questoes', 'cards', 'mais'];

const ROTAS = {
  hoje: () => import('./views/hoje.js'),
  cards: () => import('./views/cards.js'),
  questoes: () => import('./views/questoes.js'),
  simulado: () => import('./views/simulado.js'),
  plano: () => import('./views/plano.js'),
  escada: () => import('./views/escada.js'),
  metodos: () => import('./views/metodos.js'),
  progresso: () => import('./views/progresso.js'),
  foco: () => import('./views/focoView.js'),
  mapas: () => import('./views/mapas.js'),
  ajustes: () => import('./views/ajustes.js'),
  mais: () => import('./views/mais.js'),
};

const LOGO = `<span class="logo-box" aria-hidden="true">I</span>`;

let limpar = null;

function casca() {
  document.getElementById('app').innerHTML = `
  <div class="app">
    <nav class="lateral" aria-label="Navegação principal">
      <div class="marca">${LOGO}<span>${esc(APP.nome)}<small>${esc(APP.longo)}</small></span></div>
      ${NAV.map((n) => n.sep ? '<div class="nav-sep"></div>' : `<a class="nav-item" href="#/${n.r}" data-r="${n.r}">${ic(n.ic)}<span>${n.rot}</span></a>`).join('')}
    </nav>
    <div class="principal">
      <header class="hud"><span class="hud-titulo" id="hud-titulo"></span><div class="hud-info" id="hud-info"></div></header>
      <main class="conteudo" id="tela" tabindex="-1"></main>
    </div>
    <nav class="abas-baixo" aria-label="Navegação">
      ${ABAS.map((r) => { const n = NAV.find((x) => x.r === r) || { r: 'mais', rot: 'Mais', ic: 'ellipsis' }; return `<a href="#/${r}" data-r="${r}">${ic(n.ic, 22)}<span>${n.r === 'cards' ? 'Cards' : n.r === 'escada' ? 'Rumo ao 45' : n.rot}</span></a>`; }).join('')}
    </nav>
  </div>`;
}

export function hud() {
  const el = document.getElementById('hud-info');
  if (!el) return;
  const dias = S.perfil.dataProva ? diffDias(hojeStr(), S.perfil.dataProva) : null;
  const seq = sequencia();
  const f = foco.estado();
  el.innerHTML = `
    ${f.ativo ? `<button class="hud-foco" onclick="location.hash='#/foco'">${ic('timer', 14)}<span id="hud-relogio">${f.texto}</span></button>` : ''}
    ${dias !== null && dias >= 0 ? `<span title="Dias até a prova">${ic('flag', 15)}${dias === 0 ? 'É hoje' : dias + (dias === 1 ? ' dia' : ' dias')}</span>` : ''}
    <span title="Dias seguidos estudando">${ic('flame', 15)}${seq}</span>`;
}

const TITULOS = { hoje: 'Hoje', escada: 'Rumo ao 45', cards: 'Flashcards', questoes: 'Questões', simulado: 'Simulado', plano: 'Plano de estudos', progresso: 'Progresso', metodos: 'Métodos de prova', foco: 'Foco', mapas: 'Mapas mentais', ajustes: 'Ajustes', mais: 'Mais' };

async function rotear() {
  const h = location.hash.replace(/^#\/?/, '') || 'hoje';
  const [caminho, qs] = h.split('?');
  const partes = caminho.split('/').filter(Boolean);
  const r = ROTAS[partes[0]] ? partes[0] : 'hoje';
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  document.querySelectorAll('[data-r]').forEach((a) => a.classList.toggle('ativo', a.dataset.r === r || (r === 'simulado' && a.dataset.r === 'questoes') || (!ABAS.includes(r) && a.dataset.r === 'mais' && a.closest('.abas-baixo'))));
  document.getElementById('hud-titulo').textContent = TITULOS[r] || '';
  if (limpar) { try { limpar(); } catch {} limpar = null; }
  const tela = document.getElementById('tela');
  tela.innerHTML = '<div class="carregando">Carregando…</div>';
  try {
    const mod = await ROTAS[r]();
    tela.innerHTML = '';
    limpar = (await mod.render(tela, partes.slice(1), params)) || null;
  } catch (e) {
    console.error(e);
    tela.innerHTML = `<div class="vazio"><p class="vazio-titulo">Algo deu errado ao abrir esta tela.</p><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">Recarregar</button></div>`;
  }
  window.scrollTo(0, 0);
  hud();
}

export function aplicarTema() {
  document.documentElement.dataset.tema = ['escuro', 'sistema'].includes(S.perfil.tema) ? S.perfil.tema : 'claro';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', S.perfil.tema === 'escuro' ? '#0a0a0a' : '#ffffff');
}

async function iniciar() {
  await carregar();
  aplicarTema();
  document.title = APP.nome;
  casca();
  aoMudar(hud);
  foco.aoTique(() => { const el = document.getElementById('hud-relogio'); if (el) el.textContent = foco.estado().texto; else hud(); });
  await carregarIndice().catch((e) => console.error('Índice de questões', e));
  window.addEventListener('hashchange', rotear);
  rotear();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

iniciar();
