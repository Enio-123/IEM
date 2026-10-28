// Retrato da Matemática dela pela TRI: nota estimada e quantos acertos ela faria numa prova real.
import { S } from './store.js';
import { meta, indice, transformacoes } from './qbank.js';
import { estimarTheta, prob, transformacao } from './tri.js';

export const MINIMO = 15;

// Usa a última resposta de cada questão nos últimos 90 dias.
export function retrato(dias = 90) {
  const limite = Date.now() - dias * 86400000;
  const ult = new Map();
  for (const r of S.respostas) {
    if (r.em < limite) continue;
    const m = meta(r.qid); if (!m || !m.p) continue;
    ult.set(r.qid, { p: m.p, ok: r.ok });
  }
  const itens = [...ult.values()];
  if (itens.length < MINIMO) return { n: itens.length, theta: null, nota: null, esperado: null };
  const theta = estimarTheta(itens);
  const [k, b] = transformacao(transformacoes(), 'MT');
  return { n: itens.length, theta, nota: Math.round(k * theta + b), esperado: acertosEsperados(theta) };
}

// Acertos esperados em 45 questões: média das três provas mais recentes do banco, com os parâmetros oficiais.
export function acertosEsperados(theta) {
  const anos = [...new Set(indice().map((m) => m.y))].sort((a, b) => b - a).slice(0, 3);
  const porAno = anos.map((y) => {
    const it = indice().filter((m) => m.y === y && m.p);
    return it.length ? (it.reduce((s, m) => s + prob(m.p, theta), 0) * 45) / it.length : null;
  }).filter((x) => x !== null);
  return porAno.length ? porAno.reduce((a, b) => a + b, 0) / porAno.length : null;
}
