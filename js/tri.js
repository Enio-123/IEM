// Estimativa de nota pela TRI (modelo logístico de 3 parâmetros, D = 1) com os parâmetros oficiais
// publicados pelo INEP nos microdados (ITENS_PROVA). Estimador EAP com priori normal padrão.
// A conversão para a escala do ENEM usa a transformação linear de cada área e ano.

const PONTOS = [];
for (let t = -4; t <= 4.0001; t += 0.1) PONTOS.push(+t.toFixed(2));
const PRIORI = PONTOS.map((t) => Math.exp(-t * t / 2));

export const prob = ([a, b, c], t) => c + (1 - c) / (1 + Math.exp(-a * (t - b)));

// itens: [{p:[a,b,c], ok:boolean}]
export function estimarTheta(itens) {
  const validos = itens.filter((i) => i.p);
  if (!validos.length) return null;
  const logL = PONTOS.map((t) => {
    let s = 0;
    for (const i of validos) {
      const p = Math.min(0.9999, Math.max(0.0001, prob(i.p, t)));
      s += i.ok ? Math.log(p) : Math.log(1 - p);
    }
    return s;
  });
  const max = Math.max(...logL);
  let num = 0, den = 0;
  PONTOS.forEach((t, k) => { const w = Math.exp(logL[k] - max) * PRIORI[k]; num += t * w; den += w; });
  return num / den;
}

// Transformação média por área (quando os itens vêm de anos diferentes).
export function transformacao(tr, area, ano) {
  if (ano && tr[`${ano}-${area}`]) return tr[`${ano}-${area}`];
  const lista = Object.entries(tr).filter(([k]) => k.endsWith('-' + area)).map(([, v]) => v);
  if (!lista.length) return [100, 500];
  return [lista.reduce((s, v) => s + v[0], 0) / lista.length, lista.reduce((s, v) => s + v[1], 0) / lista.length];
}

export function estimarNota(itens, tr, area, ano) {
  const t = estimarTheta(itens);
  if (t === null) return null;
  const [k, b] = transformacao(tr, area, ano);
  return Math.round(k * t + b);
}

export function nivelItem(p, tr, area, ano) {
  if (!p) return null;
  const [k, b] = transformacao(tr, area, ano);
  return Math.round(k * p[1] + b);
}

export function faixa(nivel) {
  if (nivel === null || nivel === undefined) return { id: 'na', rot: 'Sem dado' };
  if (nivel < 550) return { id: 'facil', rot: 'Fácil' };
  if (nivel < 650) return { id: 'media', rot: 'Média' };
  if (nivel < 750) return { id: 'dificil', rot: 'Difícil' };
  return { id: 'muito', rot: 'Muito difícil' };
}

// Questões que mais pesam contra a nota: itens fáceis errados (a TRI pune incoerência).
export function errosQuePesam(itens, tr, area, ano) {
  return itens.filter((i) => i.p && !i.ok).map((i) => ({ ...i, nivel: nivelItem(i.p, tr, area, ano) })).sort((a, b) => a.nivel - b.nivel);
}
