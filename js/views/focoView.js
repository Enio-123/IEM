import { S, salvar, hojeStr, addDias } from '../store.js';
import { listaDisciplinas } from '../rotina.js';
import { foco } from '../foco.js';
import { ic } from '../icons.js';
import { esc, colunas } from '../ui.js';

const R = 110, C = 2 * Math.PI * R;

export function render(el) {
  const DISCIPLINAS = listaDisciplinas();
  let materia = DISCIPLINAS[0].nome;
  const desenhar = () => {
    const f = foco.estado();
    const p = S.perfil.pomodoro;
    const hoje = S.dias[hojeStr()]?.min || 0;
    const sem = Array.from({ length: 7 }, (_, i) => { const d = addDias(hojeStr(), i - 6); return { rot: new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), v: S.dias[d]?.min || 0 }; });
    el.innerHTML = `
      <div class="estudo">
        <div class="cartao" style="padding:28px">
          <div class="foco-anel">
            <svg viewBox="0 0 240 240"><circle class="trilho" cx="120" cy="120" r="${R}"/><circle class="prog" id="anel" cx="120" cy="120" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - f.progresso)}"/></svg>
            <div style="text-align:center"><div class="foco-relogio" id="rel" style="margin:0">${f.ativo ? f.texto.replace('Pausa ', '') : String(p.foco).padStart(2, '0') + ':00'}</div>
            <div class="sub">${f.ativo ? (f.fase === 'pausa' ? 'Pausa' : esc(f.materia || 'Foco')) : 'Pronto para começar'}</div></div>
          </div>
          ${f.ativo ? `
            <div class="linha-acoes" style="justify-content:center">
              ${f.pausadoEm ? `<button class="btn primario" id="cont">${ic('play', 16)}Continuar</button>` : `<button class="btn" id="pausar">${ic('pause', 16)}Pausar</button>`}
              <button class="btn" id="pular">${f.fase === 'pausa' ? 'Encerrar pausa' : 'Concluir agora'}</button>
              <button class="btn fantasma" id="cancelar">Cancelar</button>
            </div>` : `
            <div class="grade" style="margin-top:20px">
              <label class="campo">Matéria<select id="mat">${DISCIPLINAS.map((d) => `<option ${d.nome === materia ? 'selected' : ''}>${esc(d.nome)}</option>`).join('')}<option>Revisão geral</option></select></label>
              <div class="grupo filtros"><span class="rot">Duração</span><div class="seg" id="dur">${[[25, 5], [50, 10]].map(([a, b]) => `<button class="${p.foco === a ? 'on' : ''}" data-f="${a}" data-p="${b}">${a} + ${b} min</button>`).join('')}</div></div>
              <button class="btn primario grande" id="ir">${ic('play', 18)}Começar</button>
            </div>`}
        </div>
        <div class="cartao secao"><div class="entre"><h3>Minutos de foco</h3><span class="sub">Hoje: ${hoje} min</span></div>${colunas(sem, { sufixo: '' })}</div>
        <p class="mini" style="margin-top:10px">O timer continua rodando se você trocar de tela. O tempo concluído entra no seu histórico.</p>
      </div>`;
    const b = (id) => el.querySelector('#' + id);
    if (b('ir')) {
      b('mat').onchange = (e) => (materia = e.target.value);
      el.querySelectorAll('#dur [data-f]').forEach((x) => x.onclick = () => { p.foco = +x.dataset.f; p.pausa = +x.dataset.p; salvar(); desenhar(); });
      b('ir').onclick = () => { foco.comecar(p.foco, b('mat').value); desenhar(); };
    } else {
      b('pausar') && (b('pausar').onclick = () => { foco.pausar(); desenhar(); });
      b('cont') && (b('cont').onclick = () => { foco.continuar(); desenhar(); });
      b('pular').onclick = () => { foco.pular(); desenhar(); };
      b('cancelar').onclick = () => { foco.cancelar(); desenhar(); };
    }
  };
  let faseAnt = foco.estado().fase + foco.estado().ativo;
  const off = foco.aoTique(() => {
    const f = foco.estado();
    if (f.fase + f.ativo !== faseAnt) { faseAnt = f.fase + f.ativo; desenhar(); return; }
    const r = el.querySelector('#rel'); if (r) r.textContent = f.texto.replace('Pausa ', '');
    const a = el.querySelector('#anel'); if (a) a.setAttribute('stroke-dashoffset', C * (1 - f.progresso));
  });
  desenhar();
  return off;
}
