// Plano semanal automático, revisões programadas (1, 7 e 30 dias) e checklist do dia.
import { S, salvar, hojeStr, addDias, uid, diaAtual } from './store.js';
import { meta, indice } from './qbank.js';
import { TOPICOS } from './content.js';
import { fila } from './srs.js';

// Assuntos do plano: peso base = quantas questões do assunto caem, em média, por prova (ENEM 2009 a 2023).
export let DISCIPLINAS = [];
function montarDisciplinas() {
  if (DISCIPLINAS.length && DISCIPLINAS[0].base) return DISCIPLINAS;
  const cont = {};
  for (const m of indice()) cont[m.d] = (cont[m.d] || 0) + 1;
  const anos = new Set(indice().map((m) => m.y)).size || 15;
  DISCIPLINAS = TOPICOS.map((t, i) => ({ id: 't' + i, nome: t.nome, mats: [t.nome], base: (cont[t.nome] || 0) / anos }));
  return DISCIPLINAS;
}
export const disc = (id) => montarDisciplinas().find((d) => d.id === id) || { id, nome: 'Matemática', mats: [] };
export const discDaQuestao = (m) => (montarDisciplinas().find((d) => d.nome === m.d) || {}).id || null;
export const listaDisciplinas = () => montarDisciplinas();

// Taxa de erro recente por assunto (últimas 300 respostas).
export function taxaErro() {
  const t = {};
  for (const r of S.respostas.slice(-300)) {
    const m = meta(r.qid); if (!m) continue;
    const d = discDaQuestao(m); if (!d) continue;
    t[d] = t[d] || { e: 0, n: 0 };
    t[d].n++; if (!r.ok) t[d].e++;
  }
  return t;
}

// Prioridade = frequência na prova × (0,6 + taxa de erro). Sem dados, assume 50% de erro.
export function gerarPlano() {
  const lista = montarDisciplinas();
  const erros = taxaErro();
  const prioridade = lista.map((d) => {
    const e = erros[d.id] && erros[d.id].n >= 6 ? erros[d.id].e / erros[d.id].n : 0.5;
    return { id: d.id, w: Math.max(0.2, d.base) * (0.6 + e) };
  });
  const blocosDia = [0, 1, 2, 3, 4, 5, 6].map((w) => Math.max(0, Math.floor(S.perfil.horas[w] || 0)));
  const total = blocosDia.reduce((a, b) => a + b, 0);
  const soma = prioridade.reduce((a, p) => a + p.w, 0) || 1;
  const cotas = prioridade.map((p) => ({ id: p.id, ex: (p.w / soma) * total }));
  cotas.forEach((c) => (c.n = Math.floor(c.ex)));
  let falta = total - cotas.reduce((a, c) => a + c.n, 0);
  cotas.slice().sort((a, b) => (b.ex - b.n) - (a.ex - a.n)).forEach((c) => { if (falta > 0) { c.n++; falta--; } });
  // Distribui pelos dias evitando o mesmo assunto duas vezes no mesmo dia.
  const sacola = [];
  cotas.slice().sort((a, b) => b.n - a.n).forEach((c) => { for (let i = 0; i < c.n; i++) sacola.push(c.id); });
  const dias = blocosDia.map(() => []);
  let k = 1;
  for (const id of sacola) {
    let tent = 0, w;
    do { w = (k++) % 7; tent++; } while ((dias[w].length >= blocosDia[w] || (dias[w].includes(id) && tent < 14)) && tent < 28);
    if (dias[w].length >= blocosDia[w]) { w = dias.findIndex((d, i) => d.length < blocosDia[i]); if (w < 0) break; }
    dias[w].push(id);
  }
  S.plano = { geradoEm: hojeStr(), dias, cotas: Object.fromEntries(cotas.map((c) => [c.id, c.n])), feitos: {} };
  salvar();
  return S.plano;
}

export function blocosDe(data) {
  if (!S.plano) return [];
  const w = new Date(data + 'T12:00:00').getDay();
  const feitos = (S.plano.feitos && S.plano.feitos[data]) || [];
  return (S.plano.dias[w] || []).map((id, i) => ({ id, i, feito: feitos.includes(i), d: disc(id) }));
}

export function marcarBloco(data, i, feito) {
  S.plano.feitos = S.plano.feitos || {};
  const l = new Set(S.plano.feitos[data] || []);
  feito ? l.add(i) : l.delete(i);
  S.plano.feitos[data] = [...l];
  salvar();
}

// Revisões programadas: ela registra o assunto estudado e o app agenda 1, 7 e 30 dias depois.
export function registrarAssunto(nome, discId) {
  const hoje = hojeStr();
  S.assuntos.push({ id: uid(), nome, disc: discId || null, em: hoje, revs: [1, 7, 30].map((n) => ({ dia: addDias(hoje, n), n, feito: false })) });
  salvar();
}
export function revisoesPendentes(ate = hojeStr()) {
  const out = [];
  for (const a of S.assuntos) for (const r of a.revs) if (!r.feito && r.dia <= ate) out.push({ a, r });
  return out.sort((x, y) => x.r.dia.localeCompare(y.r.dia));
}

// Checklist do dia: itens automáticos + tarefas próprias. Modo leve reduz o volume.
export function tarefasDoDia() {
  const d = diaAtual();
  const leve = !!d.leve;
  const hoje = hojeStr();
  const f = fila(S.cards, { limiteNovos: leve ? 5 : S.perfil.novosPorDia, novosHoje: d.novos || 0, limiteRevisoes: leve ? 30 : Infinity });
  const itens = [];
  const alvoCards = (d.cards || 0) + f.total;
  itens.push({ tipo: 'cards', rot: f.total ? `Revisar ${f.total} flashcard${f.total > 1 ? 's' : ''}` : 'Flashcards em dia', feito: f.total === 0, link: '#/cards/estudar', info: alvoCards ? `${d.cards || 0} feitos hoje` : '' });
  const blocos = blocosDe(hoje);
  (leve ? blocos.slice(0, 1) : blocos).forEach((b) => itens.push({ tipo: 'bloco', i: b.i, rot: `${b.d.nome}: teoria + questões`, feito: b.feito, info: '50 min' }));
  const metaE = leve ? 5 : 10;
  itens.push({ tipo: 'escada', rot: `Rumo ao 45: ${metaE} questões do seu degrau`, feito: (d.escada || 0) >= metaE, link: '#/escada', info: `${d.escada || 0}/${metaE}` });
  const errosPend = Object.values(S.erros).filter((e) => !e.resolvido).length;
  if (errosPend && !leve) itens.push({ tipo: 'erros', rot: 'Refazer questões do caderno de erros', feito: (d.refeitas || 0) >= Math.min(5, errosPend), link: '#/questoes/erros', info: `${errosPend} para refazer` });
  const w = new Date(hoje + 'T12:00:00').getDay();
  if ((w === 6 || w === 0) && !leve) {
    const simHoje = S.simulados.some((s) => s.fim && hojeStr(new Date(s.fim)) === hoje);
    itens.push({ tipo: 'simulado', rot: 'Simulado de 45 questões no tempo', feito: simHoje, link: '#/questoes/simulado', info: 'fim de semana' });
  }
  for (const { a, r } of revisoesPendentes(hoje)) itens.push({ tipo: 'revisao', aid: a.id, n: r.n, rot: `Revisar: ${a.nome}`, feito: false, info: r.dia < hoje ? 'atrasada' : `${r.n} ${r.n === 1 ? 'dia' : 'dias'}` });
  (d.tarefas || []).forEach((t) => itens.push({ tipo: 'propria', tid: t.id, rot: t.rot, feito: t.feito }));
  return { itens, leve };
}
