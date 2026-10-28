// Banco de questões: as 670 questões de Matemática das provas oficiais do ENEM (2009–2023).
import { S } from './store.js';
import { nivelItem, faixa } from './tri.js';
import { degrauDe } from './content.js';
import { esc, md } from './ui.js';

let INDICE = null, TR = {};
const ANOS = {};
const POR_ID = new Map();

export async function carregarIndice() {
  if (INDICE) return INDICE;
  const r = await fetch('data/index.json');
  const j = await r.json();
  INDICE = j.q; TR = j.tr;
  for (const m of INDICE) {
    m.nivel = nivelItem(m.p, TR, m.ar, m.y);
    m.fx = faixa(m.nivel).id;
    m.dg = degrauDe(m.nivel)?.id ?? null;
    POR_ID.set(m.id, m);
  }
  return INDICE;
}
export const transformacoes = () => TR;
export const indice = () => INDICE || [];
export const meta = (id) => POR_ID.get(id) || propriaMeta(id);

export async function carregarAno(y) {
  if (ANOS[y]) return ANOS[y];
  ANOS[y] = fetch(`data/${y}.json`).then((r) => { if (!r.ok) throw new Error('Falha ao carregar ' + y); return r.json(); }).then((j) => {
    const mapa = {};
    for (const q of j.q) mapa[q.id] = q;
    return { q: mapa, img: j.img };
  }).catch((e) => { delete ANOS[y]; throw e; });
  return ANOS[y];
}

function propriaMeta(id) {
  const q = S.questoesProprias.find((x) => x.id === id);
  if (!q) return null;
  return { id: q.id, y: null, n: null, ar: q.area || 'OUTRA', d: q.materia || '', g: q.g, propria: true, trilha: q.trilha, fx: 'na', nivel: null };
}

export async function questao(id) {
  const m = meta(id);
  if (!m) return null;
  if (m.propria) {
    const q = S.questoesProprias.find((x) => x.id === id);
    return { m, q: { t: q.t, q: q.q || '', al: q.al.map((a) => [a[0], a[1], null]), g: q.g }, imgs: null };
  }
  const ano = await carregarAno(m.y);
  return { m, q: ano.q[id], imgs: ano.img };
}

// Situação de cada questão para ela: nunca feita, acertou na última vez ou errou na última vez.
export function situacao() {
  const ult = new Map();
  for (const r of S.respostas) ult.set(r.qid, r.ok);
  return ult;
}

export function filtrar({ anos = [], materias = [], faixas = [], degraus = [], status = 'todas', busca = '' } = {}) {
  const sit = situacao();
  return indice().filter((m) => {
    if (anos.length && !anos.includes(m.y)) return false;
    if (materias.length && !materias.includes(m.d)) return false;
    if (faixas.length && !faixas.includes(m.fx)) return false;
    if (degraus.length && !degraus.includes(m.dg)) return false;
    if (status === 'novas' && sit.has(m.id)) return false;
    if (status === 'erradas' && sit.get(m.id) !== false) return false;
    if (status === 'certas' && sit.get(m.id) !== true) return false;
    if (busca && !(String(m.n) === busca.trim() || m.id.includes(busca.trim()))) return false;
    return true;
  });
}

export const embaralhar = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export function rotuloQuestao(m) {
  if (m.propria) return `Questão própria${m.d ? ' · ' + esc(m.d) : ''}`;
  return `ENEM ${m.y} · Q${m.n}`;
}

export function etiquetas(m) {
  const t = [];
  if (!m.propria) {
    t.push(m.d);
    if (m.nivel) t.push(`${faixa(m.nivel).rot} · nível ${m.nivel}`);
    if (m.h) t.push('H' + m.h);
  }
  return t.map((x) => `<span class="etq">${esc(x)}</span>`).join('');
}

// HTML do enunciado e das alternativas. resp: letra escolhida; revelar: mostra gabarito.
export function htmlQuestao(dados, { resp = null, revelar = false, numero = null } = {}) {
  const { m, q, imgs } = dados;
  const alts = q.al.map(([l, txt, f]) => {
    const cls = ['alt'];
    if (resp === l) cls.push('escolhida');
    if (revelar && l === q.g) cls.push('correta');
    if (revelar && resp === l && l !== q.g) cls.push('errada');
    const conteudo = f && imgs && imgs[f] ? `<img src="${imgs[f]}" alt="Alternativa ${l}">` : md(txt, { inline: true });
    return `<button class="${cls.join(' ')}" data-alt="${l}" ${revelar ? 'disabled' : ''} aria-pressed="${resp === l}">
      <span class="alt-letra">${l}</span><span class="alt-txt">${conteudo}</span></button>`;
  }).join('');
  return `<article class="questao">
    <header class="questao-topo"><span class="questao-id">${numero ? `<b>${numero}</b> · ` : ''}${rotuloQuestao(m)}</span><span class="etqs">${etiquetas(m)}</span></header>
    <div class="enunciado">${md(q.t, { imgs })}</div>
    ${q.q ? `<div class="comando">${md(q.q, { imgs })}</div>` : ''}
    <div class="alts">${alts}</div>
  </article>`;
}

// Texto pronto para colar em uma IA e pedir a resolução comentada.
export function promptExplicacao(dados, resp) {
  const { m, q } = dados;
  const limpa = (s) => String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '[imagem]');
  const alts = q.al.map(([l, t, f]) => `${l}) ${f ? '[imagem]' : limpa(t)}`).join('\n');
  return `Sou estudante me preparando para a prova de Matemática do ENEM (hoje acerto ${S.perfil.acertosAtual} de 45 e quero chegar a ${S.perfil.acertosMeta}). Explique passo a passo a questão abaixo${m.y ? ` (ENEM ${m.y}, questão ${m.n})` : ''}.
Diga qual conteúdo ela cobra, qual o caminho mais rápido para resolver na prova, resolva de forma clara, mostre por que a alternativa correta é a ${q.g} e por que cada alternativa errada está errada.${resp && resp !== q.g ? ` Eu marquei ${resp}; mostre onde está o erro desse raciocínio.` : ''} No final, dê uma dica curta para reconhecer esse tipo de questão.

${limpa(q.t)}

${limpa(q.q)}

${alts}

Gabarito oficial: ${q.g}`;
}
