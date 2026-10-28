import { S, salvar, hojeStr, diffDias, diaAtual, uid, sequencia, addDias } from '../store.js';
import { tarefasDoDia, marcarBloco, gerarPlano, disc, registrarAssunto } from '../rotina.js';
import { ic } from '../icons.js';
import { esc, fmtData, janela, toast, barra } from '../ui.js';
import { foco } from '../foco.js';
import { retrato } from '../meta45.js';

export function render(el) {
  if (!S.plano) gerarPlano();
  const desenhar = () => {
    const d = diaAtual();
    const { itens, leve } = tarefasDoDia();
    const dias = S.perfil.dataProva ? diffDias(hojeStr(), S.perfil.dataProva) : null;
    const feitas = itens.filter((i) => i.feito).length;
    const seq = sequencia();
    // Semana: questões e cards dos últimos 7 dias contra as metas.
    let qSem = 0;
    for (let i = 0; i < 7; i++) { const x = S.dias[addDias(hojeStr(), -i)]; if (x) qSem += x.questoes || 0; }
    const r = retrato();
    const hora = new Date().getHours();
    const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    el.innerHTML = `
      <div class="topo-pagina">
        <div><h1>${saud}${S.perfil.nome ? ', ' + esc(S.perfil.nome) : ''}</h1><p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <label class="alternar" title="Plano reduzido para dias de cansaço, sem perder a sequência"><input type="checkbox" id="leve" ${leve ? 'checked' : ''}><span>Dia leve</span></label>
      </div>
      <div class="grade g3">
        <div class="cartao">
          <span class="rot">Prova</span>
          ${dias === null ? `<p class="sub" style="margin-top:8px">Defina a data da prova em Ajustes.</p>` : `
          <div class="contagem" style="margin-top:6px"><span class="num">${Math.max(0, dias)}</span><span class="sub">${dias === 1 ? 'dia' : 'dias'}</span></div>
          <p class="mini">Matemática no 2º dia · ${fmtData(S.perfil.dataProva)}</p>`}
        </div>
        <div class="cartao">
          <span class="rot">Sequência</span>
          <div class="contagem" style="margin-top:6px"><span class="num">${seq}</span><span class="sub">${seq === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>
          <p class="mini">${(d.cards || 0) + (d.questoes || 0) + (d.min || 0) > 0 ? 'Hoje já conta.' : 'Estude qualquer coisa hoje para manter.'}</p>
        </div>
        <a class="cartao clicavel" href="#/escada" style="text-decoration:none">
          <span class="rot">Rumo ao ${S.perfil.acertosMeta}</span>
          <div class="contagem" style="margin-top:6px"><span class="num">${r.esperado !== null ? Math.round(r.esperado) : S.perfil.acertosAtual}</span><span class="sub">de 45 ${r.esperado !== null ? 'esperados' : 'hoje'}</span></div>
          ${barra(r.esperado !== null ? r.esperado : S.perfil.acertosAtual, S.perfil.acertosMeta)}
          <p class="mini">${qSem} de ${S.perfil.metaQuestoesSemana} questões nesta semana</p>
        </a>
      </div>

      <section class="secao">
        <div class="entre" style="margin-bottom:8px"><h2>Checklist de hoje</h2><span class="sub">${feitas}/${itens.length}</span></div>
        ${leve ? '<p class="aviso" style="margin-bottom:8px">Dia leve: só o essencial. Descansar também faz parte do plano.</p>' : ''}
        <div class="cartao" style="padding:4px 18px">
          ${itens.map((t, k) => `
            <div class="tarefa ${t.feito ? 'feita' : ''}">
              <button class="marcador" data-k="${k}" aria-label="${t.feito ? 'Desmarcar' : 'Marcar como feito'}">${t.feito ? ic('check', 14) : ''}</button>
              <div class="tarefa-txt">${esc(t.rot)}${t.info ? `<div class="mini">${esc(t.info)}</div>` : ''}</div>
              ${t.link ? `<a class="btn peq" href="${t.link}">Abrir</a>` : ''}
              ${t.tipo === 'bloco' && !t.feito ? `<button class="btn peq" data-foco="${k}">${ic('play', 14)}Focar</button>` : ''}
              ${t.tipo === 'propria' ? `<button class="btn-icone" data-apagar="${t.tid}" aria-label="Apagar tarefa">${ic('trash-2', 16)}</button>` : ''}
            </div>`).join('')}
          <form id="nova" class="tarefa" style="gap:8px"><span style="width:22px">${ic('plus', 18)}</span><input type="text" id="nova-txt" placeholder="Adicionar tarefa" aria-label="Nova tarefa" style="border:0;padding:6px 0;background:none"></form>
        </div>
      </section>

      <section class="secao grade g2">
        <a class="cartao clicavel" href="#/questoes/treino" style="text-decoration:none">
          <div class="entre"><h3>Treino rápido</h3>${ic('zap')}</div>
          <p class="sub">Questões de Matemática do ENEM com correção na hora. Bom para 15 minutos livres.</p>
        </a>
        <a class="cartao clicavel" href="#/questoes/simulado" style="text-decoration:none">
          <div class="entre"><h3>Simulado de 45</h3>${ic('clock')}</div>
          <p class="sub">Prova inteira, mista ou só as mais difíceis, no tempo, com nota pela TRI.</p>
        </a>
      </section>`;

    el.querySelector('#leve').onchange = (e) => { d.leve = e.target.checked; salvar(); desenhar(); };
    el.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => alternar(itens[+b.dataset.k]));
    el.querySelectorAll('[data-foco]').forEach((b) => b.onclick = () => {
      const t = itens[+b.dataset.foco];
      foco.comecar(50, t.rot.split(':')[0]);
      location.hash = '#/foco';
    });
    el.querySelectorAll('[data-apagar]').forEach((b) => b.onclick = () => { d.tarefas = (d.tarefas || []).filter((t) => t.id !== b.dataset.apagar); salvar(); desenhar(); });
    el.querySelector('#nova').onsubmit = (e) => {
      e.preventDefault();
      const v = el.querySelector('#nova-txt').value.trim(); if (!v) return;
      d.tarefas = d.tarefas || []; d.tarefas.push({ id: uid(), rot: v, feito: false }); salvar(); desenhar();
      el.querySelector('#nova-txt').focus();
    };
  };

  function alternar(t) {
    const hoje = hojeStr();
    const d = diaAtual();
    if (t.tipo === 'bloco') {
      if (!t.feito) {
        const b = disc(S.plano.dias[new Date().getDay()][t.i]);
        const { el: m, fechar } = janela('Bloco concluído', `
          <p class="sub">O que de ${esc(b.nome)} você estudou? O app agenda revisões para daqui a 1, 7 e 30 dias.</p>
          <input type="text" id="assunto" placeholder="Ex.: Probabilidade condicional">
          <div class="linha-acoes"><button class="btn" data-pular>Só marcar</button><button class="btn primario" data-ok>Salvar e agendar</button></div>`);
        m.querySelector('[data-ok]').onclick = () => { const v = m.querySelector('#assunto').value.trim(); if (v) { registrarAssunto(v, b.id); toast('Revisões agendadas'); } marcarBloco(hoje, t.i, true); fechar(); desenhar(); };
        m.querySelector('[data-pular]').onclick = () => { marcarBloco(hoje, t.i, true); fechar(); desenhar(); };
        return;
      }
      marcarBloco(hoje, t.i, false);
    } else if (t.tipo === 'revisao') {
      const a = S.assuntos.find((x) => x.id === t.aid);
      const r = a && a.revs.find((x) => x.n === t.n); if (r) r.feito = true;
      salvar();
    } else if (t.tipo === 'propria') {
      const x = (d.tarefas || []).find((y) => y.id === t.tid); if (x) x.feito = !x.feito; salvar();
    } else if (t.link) { location.hash = t.link; return; }
    desenhar();
  }

  desenhar();
}
