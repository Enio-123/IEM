import { ic } from '../icons.js';

const ITENS = [
  ['progresso', 'bar-chart-2', 'Progresso', 'Acertos esperados, nota pela TRI e assuntos fracos'],
  ['plano', 'calendar-days', 'Plano de estudos', 'Semana montada pelo que mais cai e pelos seus erros'],
  ['metodos', 'lightbulb', 'Métodos de prova', 'Como fazer a prova e como atacar cada assunto'],
  ['questoes/erros', 'bookmark', 'Caderno de erros', 'Questões para refazer'],
  ['questoes/simulado', 'clock', 'Simulado', '45 questões no tempo'],
  ['foco', 'timer', 'Foco', 'Pomodoro que registra seu tempo'],
  ['mapas', 'network', 'Mapas mentais', 'Tópicos que viram mapa'],
  ['ajustes', 'settings', 'Ajustes', 'Perfil, metas, backup e tema'],
];

export function render(el) {
  el.innerHTML = `<div class="cartao" style="padding:4px 18px"><ul class="lista">${ITENS.map(([r, i, t, d]) => `
    <li><a href="#/${r}" class="cresce entre" style="text-decoration:none;justify-content:flex-start;gap:14px">${ic(i)}<span><b style="font-weight:500">${t}</b><div class="mini">${d}</div></span></a>${ic('chevron-right', 18)}</li>`).join('')}</ul></div>`;
}
