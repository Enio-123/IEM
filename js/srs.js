// Repetição espaçada no estilo Anki (SM-2 com passos de aprendizagem).
const MIN = 60000, DIA = 86400000;
const PASSOS = [1, 10];          // minutos, para cards novos
const PASSOS_REAPRENDER = [10];  // minutos, depois de errar um card já aprendido

export const NOTAS = [
  { n: 1, rot: 'Errei', tecla: '1' },
  { n: 2, rot: 'Difícil', tecla: '2' },
  { n: 3, rot: 'Bom', tecla: '3' },
  { n: 4, rot: 'Fácil', tecla: '4' },
];

const fuzz = (d) => (d < 3 ? d : Math.round(d * (0.95 + Math.random() * 0.1)));

// Calcula o próximo estado sem alterar o card (para mostrar o intervalo nos botões).
export function proximo(card, nota, agora = Date.now()) {
  const c = { ...card };
  if (c.estado === 'novo' || c.estado === 'aprendendo' || c.estado === 'reaprendendo') {
    const passos = c.estado === 'reaprendendo' ? PASSOS_REAPRENDER : PASSOS;
    if (c.estado === 'novo') { c.estado = 'aprendendo'; c.passo = 0; }
    if (nota === 1) { c.passo = 0; c.venc = agora + passos[0] * MIN; }
    else if (nota === 2) { c.venc = agora + Math.max(passos[c.passo] || passos[0], 5) * MIN * 1.5; }
    else if (nota === 3) {
      c.passo++;
      if (c.passo >= passos.length) {
        const eraRe = c.estado === 'reaprendendo';
        c.estado = 'revisao';
        c.ivl = eraRe ? Math.max(1, c.ivl) : 1;
        c.venc = agora + c.ivl * DIA;
      } else c.venc = agora + passos[c.passo] * MIN;
    } else {
      const eraRe = c.estado === 'reaprendendo';
      c.estado = 'revisao'; c.ivl = eraRe ? Math.max(c.ivl, 2) : 4; c.venc = agora + c.ivl * DIA;
    }
  } else {
    if (nota === 1) {
      c.lapsos++; c.fac = Math.max(1.3, c.fac - 0.2); c.ivl = Math.max(1, Math.round(c.ivl * 0.3));
      c.estado = 'reaprendendo'; c.passo = 0; c.venc = agora + PASSOS_REAPRENDER[0] * MIN;
    } else if (nota === 2) {
      c.fac = Math.max(1.3, c.fac - 0.15); c.ivl = fuzz(Math.max(c.ivl + 1, Math.round(c.ivl * 1.2))); c.venc = agora + c.ivl * DIA;
    } else if (nota === 3) {
      c.ivl = fuzz(Math.max(c.ivl + 1, Math.round(c.ivl * c.fac))); c.venc = agora + c.ivl * DIA;
    } else {
      c.fac += 0.15; c.ivl = fuzz(Math.max(c.ivl + 2, Math.round(c.ivl * c.fac * 1.3))); c.venc = agora + c.ivl * DIA;
    }
  }
  c.reps++;
  c.ult = agora;
  return c;
}

export function rotuloIntervalo(card, nota) {
  const ms = proximo(card, nota).venc - Date.now();
  if (ms < 3600000) return Math.max(1, Math.round(ms / MIN)) + ' min';
  if (ms < DIA) return Math.round(ms / 3600000) + ' h';
  const d = Math.round(ms / DIA);
  if (d < 30) return d + ' d';
  if (d < 365) return (d / 30).toFixed(1).replace('.0', '').replace('.', ',') + ' m';
  return (d / 365).toFixed(1).replace('.', ',') + ' a';
}

// Monta a fila de estudo: vencidos primeiro, depois novos até o limite do dia.
export function fila(cards, { decks = null, limiteNovos = 20, novosHoje = 0, limiteRevisoes = Infinity } = {}) {
  const agora = Date.now();
  const fimDoDia = new Date(); fimDoDia.setHours(23, 59, 59, 999);
  const lista = Object.values(cards).filter((c) => !decks || decks.includes(c.deck));
  const aprendendo = lista.filter((c) => (c.estado === 'aprendendo' || c.estado === 'reaprendendo') && c.venc <= agora + 20 * MIN);
  const revisoes = lista.filter((c) => c.estado === 'revisao' && c.venc <= fimDoDia.getTime()).sort((a, b) => a.venc - b.venc).slice(0, limiteRevisoes);
  const novos = lista.filter((c) => c.estado === 'novo').sort((a, b) => a.criado - b.criado).slice(0, Math.max(0, limiteNovos - novosHoje));
  return { aprendendo, revisoes, novos, total: aprendendo.length + revisoes.length + novos.length };
}
