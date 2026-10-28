import { S, salvar, hojeStr, addDias } from '../store.js';
import { gerarPlano, blocosDe, marcarBloco, listaDisciplinas, disc, taxaErro, revisoesPendentes, registrarAssunto } from '../rotina.js';
import { ic } from '../icons.js';
import { esc, janela, toast, fmtData, pct, vazio } from '../ui.js';
import { foco } from '../foco.js';
import { topico } from '../content.js';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function render(el) {
  if (!S.plano) gerarPlano();
  const desenhar = () => {
    const hoje = hojeStr();
    const w0 = new Date(hoje + 'T12:00:00').getDay();
    const inicio = addDias(hoje, -w0);
    const erros = taxaErro();
    const total = Object.values(S.plano.cotas).reduce((a, b) => a + b, 0);
    const proximas = revisoesPendentes(addDias(hoje, 30)).slice(0, 12);
    el.innerHTML = `
      <div class="topo-pagina"><div><h1>Plano de estudos</h1><p>${total} blocos de 50 min por semana, distribuídos pelo que mais cai na prova e pelo seu desempenho. Gerado em ${fmtData(S.plano.geradoEm)}.</p></div>
        <div class="linha-acoes" style="margin:0"><button class="btn" id="horas">${ic('clock', 16)}Horas por dia</button><button class="btn primario" id="regerar">${ic('rotate-ccw', 16)}Gerar de novo</button></div></div>
      <div class="semana">${DIAS.map((nome, w) => { const data = addDias(inicio, w); const bl = blocosDe(data); return `
        <div class="dia-plano ${data === hoje ? 'hoje' : ''}"><h3><span>${nome}</span><span class="mini">${data.slice(8)}/${data.slice(5, 7)}</span></h3>
          ${bl.length ? bl.map((b) => `<button class="bloco ${b.feito ? 'feito' : ''}" data-d="${data}" data-i="${b.i}">${esc(b.d.nome)}<small>50 min</small></button>`).join('') : '<span class="mini">Descanso</span>'}
        </div>`; }).join('')}</div>
      <p class="mini" style="margin-top:8px">Clique num bloco para focar, treinar questões desse assunto ou marcar como feito.</p>

      <div class="grade g2 secao">
        <div class="cartao"><h2>Distribuição da semana</h2>
          <ul class="lista">${listaDisciplinas().filter((d) => S.plano.cotas[d.id]).sort((a, b) => S.plano.cotas[b.id] - S.plano.cotas[a.id]).map((d) => `<li><span class="cresce">${esc(d.nome)}</span><span class="sub">${erros[d.id] && erros[d.id].n >= 6 ? `${pct(erros[d.id].e, erros[d.id].n)}% de erro` : 'sem dados'}</span><b>${S.plano.cotas[d.id]}</b></li>`).join('')}</ul>
          <p class="mini" style="margin-top:8px">Assuntos que caem mais no ENEM e em que você erra mais recebem mais blocos. Gere de novo depois de alguns treinos para o plano se ajustar.</p>
        </div>
        <div class="cartao"><div class="entre"><h2>Revisões programadas</h2><button class="btn peq" id="novo-assunto">${ic('plus', 14)}Assunto estudado</button></div>
          ${proximas.length ? `<ul class="lista">${proximas.map(({ a, r }) => `<li><span class="cresce">${esc(a.nome)}<div class="mini">${a.disc ? esc(disc(a.disc).nome) + ' · ' : ''}revisão de ${r.n} ${r.n === 1 ? 'dia' : 'dias'}</div></span><span class="sub">${r.dia <= hoje ? 'hoje' : fmtData(r.dia)}</span></li>`).join('')}</ul>`
            : '<p class="sub">Quando você marca um assunto como estudado, o app agenda revisões para 1, 7 e 30 dias depois. É o que fixa o conteúdo na memória de longo prazo.</p>'}
        </div>
      </div>`;
    el.querySelector('#regerar').onclick = () => { gerarPlano(); toast('Plano gerado de novo'); desenhar(); };
    el.querySelector('#horas').onclick = editarHoras;
    el.querySelector('#novo-assunto').onclick = novoAssunto;
    el.querySelectorAll('.bloco').forEach((b) => b.onclick = () => abrirBloco(b.dataset.d, +b.dataset.i));
  };

  const abrirBloco = (data, i) => {
    const b = blocosDe(data).find((x) => x.i === i);
    const d = b.d;
    const filtroTreino = () => {
      const f = { materias: [d.nome] };
      { try { sessionStorage.setItem('iem-filtros', JSON.stringify(f)); } catch {} }
      return f;
    };
    const { el: m, fechar } = janela(d.nome, `
      <p class="sub">Sugestão para o bloco: 25 min de teoria (aula, resumo ou flashcards) e 25 min de questões do assunto.</p>${topico(d.nome) ? `<p class="aviso">${esc(topico(d.nome).metodo)}</p>` : ''}
      <div class="grade">
        <button class="btn" data-a="foco">${ic('timer', 16)}Começar 50 min de foco</button>
        <button class="btn" data-a="treino">${ic('zap', 16)}Treinar questões de ${esc(d.nome)}</button>
        <button class="btn ${b.feito ? '' : 'primario'}" data-a="feito">${ic('check', 16)}${b.feito ? 'Desmarcar' : 'Marcar como feito'}</button>
      </div>`);
    m.querySelector('[data-a=foco]').onclick = () => { foco.comecar(50, d.nome); fechar(); location.hash = '#/foco'; };
    const t = m.querySelector('[data-a=treino]'); if (t) t.onclick = () => { filtroTreino(); fechar(); location.hash = '#/questoes/treino?usar=filtros'; };
    m.querySelector('[data-a=feito]').onclick = () => { marcarBloco(data, i, !b.feito); fechar(); desenhar(); };
  };

  const editarHoras = () => {
    const h = S.perfil.horas;
    const { el: m, fechar } = janela('Horas de estudo por dia', `
      <p class="sub">Conte só o tempo de estudo fora das aulas. Cada hora vira um bloco de 50 min + 10 de pausa.</p>
      <div class="grade g2">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<label class="campo">${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][w]}<input type="number" min="0" max="14" step="1" data-w="${w}" value="${h[w] || 0}"></label>`).join('')}</div>
      <div class="linha-acoes"><span style="flex:1"></span><button class="btn primario" data-ok>Salvar e gerar plano</button></div>`);
    m.querySelector('[data-ok]').onclick = () => {
      m.querySelectorAll('[data-w]').forEach((i) => { h[i.dataset.w] = Math.max(0, Math.min(14, +i.value || 0)); });
      salvar(); gerarPlano(); fechar(); desenhar(); toast('Plano atualizado');
    };
  };

  const novoAssunto = () => {
    const { el: m, fechar } = janela('Assunto estudado', `
      <label class="campo">Assunto<input type="text" id="an" placeholder="Ex.: Volume do cone e do tronco"></label>
      <label class="campo">Assunto do ENEM<select id="ad"><option value="">—</option>${listaDisciplinas().map((d) => `<option value="${d.id}">${esc(d.nome)}</option>`).join('')}</select></label>
      <div class="linha-acoes"><span style="flex:1"></span><button class="btn primario" data-ok>Agendar revisões</button></div>`);
    m.querySelector('[data-ok]').onclick = () => {
      const v = m.querySelector('#an').value.trim(); if (!v) { toast('Escreva o assunto'); return; }
      registrarAssunto(v, m.querySelector('#ad').value || null); fechar(); desenhar(); toast('Revisões agendadas para 1, 7 e 30 dias');
    };
  };
  desenhar();
}
