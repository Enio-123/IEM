// Estado do app salvo no próprio aparelho (IndexedDB), com exportação e importação de backup.
import { CARDS_INICIAIS, ENEM_PADRAO } from './content.js';

const DB_NAME = 'iem';
const KEY = 'estado';
const VERSAO = 1;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const hojeStr = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const addDias = (str, n) => {
  const d = new Date(str + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return hojeStr(d);
};
export const diffDias = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

function estadoInicial() {
  const agora = Date.now();
  const decks = {};
  const cards = {};
  for (const [chave, lista] of Object.entries(CARDS_INICIAIS)) {
    const [area, materia] = chave.split('|');
    const id = 'd_' + area + '_' + materia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_');
    decks[id] = { id, nome: null, area, materia, criado: agora };
    for (const [frente, verso] of lista) {
      const cid = uid();
      cards[cid] = novoCard(cid, id, frente, verso);
    }
  }
  return {
    v: VERSAO,
    criado: agora,
    perfil: {
      nome: '',
      curso: 'Medicina — UFRN (Natal)',
      dataProva: ENEM_PADRAO,
      acertosAtual: 37,   // acertos de Matemática no último simulado de fora (informado por ela)
      acertosMeta: 45,
      horas: { 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
      novosPorDia: 15,
      metaQuestoesSemana: 100,
      metaCardsDia: 50,
      tema: 'claro',
      pomodoro: { foco: 25, pausa: 5 },
    },
    decks,
    cards,
    respostas: [],      // {qid, esc, ok, ms, em, modo, sim}
    erros: {},          // qid -> {motivo, nota, em, resolvido}
    notas: {},          // qid -> texto
    simulados: [],
    assuntos: [],       // revisões programadas {id, area, materia, nome, em, revs:[{dia, feito}]}
    plano: null,
    dias: {},           // 'AAAA-MM-DD' -> {cards, questoes, min, leve, tarefas:[...]}
    focos: [],          // {em, min, materia}
    mapas: [],
    questoesProprias: [],
  };
}

export function novoCard(id, deck, frente, verso, extra = {}) {
  return { id, deck, frente, verso, img: null, criado: Date.now(), estado: 'novo', venc: 0, ivl: 0, fac: 2.5, reps: 0, lapsos: 0, passo: 0, ...extra };
}

function abrir() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

let db = null;
export let S = null;
let timer = null;
const ouvintes = new Set();

export async function carregar() {
  try {
    db = await abrir();
    S = await new Promise((res) => {
      const t = db.transaction('kv').objectStore('kv').get(KEY);
      t.onsuccess = () => res(t.result || null);
      t.onerror = () => res(null);
    });
  } catch (e) {
    console.warn('IndexedDB indisponível, usando localStorage', e);
    try { S = JSON.parse(localStorage.getItem(DB_NAME) || 'null'); } catch { S = null; }
  }
  if (!S) { S = estadoInicial(); salvarJa(); }
  migrar();
  return S;
}

function migrar() {
  const base = estadoInicial();
  for (const k of Object.keys(base)) if (S[k] === undefined) S[k] = base[k];
  for (const k of Object.keys(base.perfil)) if (S.perfil[k] === undefined) S.perfil[k] = base.perfil[k];
}

function salvarJa() {
  const copia = S;
  if (db) {
    const t = db.transaction('kv', 'readwrite');
    t.objectStore('kv').put(copia, KEY);
  } else {
    try { localStorage.setItem(DB_NAME, JSON.stringify(copia)); } catch (e) { console.warn(e); }
  }
}

export function salvar() {
  clearTimeout(timer);
  timer = setTimeout(salvarJa, 250);
  ouvintes.forEach((f) => f());
}
export const aoMudar = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };

export function registrarDia(campo, n = 1) {
  const d = hojeStr();
  S.dias[d] = S.dias[d] || { cards: 0, questoes: 0, min: 0 };
  S.dias[d][campo] = (S.dias[d][campo] || 0) + n;
}

export function diaAtual() {
  const d = hojeStr();
  S.dias[d] = S.dias[d] || { cards: 0, questoes: 0, min: 0 };
  return S.dias[d];
}

export function sequencia() {
  // Dias seguidos com alguma atividade. Hoje ainda sem atividade não quebra a sequência.
  const ativo = (d) => { const x = S.dias[d]; return x && ((x.cards || 0) + (x.questoes || 0) + (x.min || 0)) > 0; };
  let d = hojeStr();
  if (!ativo(d)) d = addDias(d, -1);
  let n = 0;
  while (ativo(d)) { n++; d = addDias(d, -1); }
  return n;
}

export function exportar() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `iem-backup-${hojeStr()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function importar(arquivo) {
  const txt = await arquivo.text();
  const novo = JSON.parse(txt);
  if (!novo || typeof novo !== 'object' || !novo.perfil || !novo.cards) throw new Error('Arquivo não parece um backup do IEM.');
  S = novo; migrar(); salvarJa(); ouvintes.forEach((f) => f());
}

export function zerar() {
  S = estadoInicial(); salvarJa(); ouvintes.forEach((f) => f());
}
