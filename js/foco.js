// Timer de foco (pomodoro) que continua rodando entre telas e registra os minutos estudados.
import { S, salvar, registrarDia } from './store.js';
import { fmtTempo, toast } from './ui.js';

const CHAVE = 'iem-foco';
let st = ler();
let intervalo = null;
const tiques = new Set();

function ler() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || { ativo: false }; } catch { return { ativo: false }; }
}
function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(st)); } catch {} }

function bip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {}
}

function restante() {
  if (!st.ativo) return 0;
  if (st.pausadoEm) return st.fim - st.pausadoEm;
  return st.fim - Date.now();
}

function tique() {
  if (!st.ativo) return;
  if (!st.pausadoEm && restante() <= 0) concluir();
  tiques.forEach((f) => f());
}

function concluir() {
  const fase = st.fase;
  if (fase === 'foco') {
    const min = st.min;
    S.focos.push({ em: Date.now(), min, materia: st.materia || null });
    registrarDia('min', min);
    salvar();
    bip();
    toast(`Bloco de ${min} min concluído. Hora da pausa.`);
    if ('Notification' in window && Notification.permission === 'granted') try { new Notification('Bloco concluído', { body: `${min} minutos de foco. Faça uma pausa.` }); } catch {}
    iniciar('pausa', S.perfil.pomodoro.pausa, st.materia);
  } else {
    bip();
    toast('Pausa encerrada.');
    st = { ativo: false }; gravar(); parar();
  }
}

function iniciar(fase, min, materia) {
  st = { ativo: true, fase, min, materia, inicio: Date.now(), fim: Date.now() + min * 60000, pausadoEm: null };
  gravar();
  if (!intervalo) intervalo = setInterval(tique, 1000);
  tiques.forEach((f) => f());
}
function parar() { clearInterval(intervalo); intervalo = null; tiques.forEach((f) => f()); }

export const foco = {
  estado() {
    const r = Math.max(0, restante());
    return { ...st, restante: r, texto: (st.fase === 'pausa' ? 'Pausa ' : '') + fmtTempo(r / 1000), progresso: st.ativo ? 1 - r / (st.min * 60000) : 0 };
  },
  comecar(min, materia) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    iniciar('foco', min, materia);
  },
  pausar() { if (st.ativo && !st.pausadoEm) { st.pausadoEm = Date.now(); gravar(); tiques.forEach((f) => f()); } },
  continuar() { if (st.ativo && st.pausadoEm) { st.fim += Date.now() - st.pausadoEm; st.pausadoEm = null; gravar(); tiques.forEach((f) => f()); } },
  cancelar() {
    // Registra o tempo já focado se passou de 5 minutos.
    if (st.ativo && st.fase === 'foco') {
      const feito = Math.floor((st.min * 60000 - Math.max(0, restante())) / 60000);
      if (feito >= 5) { S.focos.push({ em: Date.now(), min: feito, materia: st.materia || null }); registrarDia('min', feito); salvar(); }
    }
    st = { ativo: false }; gravar(); parar();
  },
  pular() { if (st.ativo) concluir(); },
  aoTique(f) { tiques.add(f); return () => tiques.delete(f); },
};

if (st.ativo) intervalo = setInterval(tique, 1000);
