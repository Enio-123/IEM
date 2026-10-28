// Rumo ao 45: escada de dificuldade pelas questões oficiais, do nível base até as mais difíceis do ENEM.
import { S, salvar } from '../store.js';
import { indice, situacao, embaralhar, meta } from '../qbank.js';
import { DEGRAUS } from '../content.js';
import { retrato, MINIMO } from '../meta45.js';
import { ic } from '../icons.js';
import { esc, barra, pct, janela, toast } from '../ui.js';

// Um degrau está dominado com pelo menos 10 questões feitas e 80% de acerto nas últimas 15 respostas dele.
export function estadoDegraus() {
  const sit = situacao();
  const ult = {};
  for (const r of S.respostas) {
    const m = meta(r.qid);
    if (!m || !m.dg) continue;
    (ult[m.dg] = ult[m.dg] || []).push(r.ok);
  }
  let atualAchado = false;
  return DEGRAUS.map((d) => {
    const qs = indice().filter((m) => m.dg === d.id);
    const feitas = qs.filter((m) => sit.has(m.id)).length;
    const certas = qs.filter((m) => sit.get(m.id) === true).length;
    const recentes = (ult[d.id] || []).slice(-15);
    const taxa = recentes.length ? recentes.filter(Boolean).length / recentes.length : null;
    const dominado = feitas >= Math.min(10, qs.length) && taxa !== null && taxa >= 0.8;
    const atual = !dominado && !atualAchado;
    if (atual) atualAchado = true;
    // Assuntos que mais aparecem neste degrau.
    const cont = {};
    qs.forEach((m) => { cont[m.d] = (cont[m.d] || 0) + 1; });
    const assuntos = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    return { ...d, qs, feitas, certas, taxa, n: recentes.length, dominado, atual, assuntos };
  });
}

// Monta a sessão: primeiro as nunca feitas, depois as que errou por último, depois o resto.
function sessao(dg, qtd = 10) {
  const sit = situacao();
  const novas = embaralhar(dg.qs.filter((m) => !sit.has(m.id)));
  const erradas = embaralhar(dg.qs.filter((m) => sit.get(m.id) === false));
  const certas = embaralhar(dg.qs.filter((m) => sit.get(m.id) === true));
  return [...novas, ...erradas, ...certas].slice(0, qtd).map((m) => m.id);
}

export function render(el) {
  const p = S.perfil;
  const r = retrato();
  const degs = estadoDegraus();
  const atual = degs.find((d) => d.atual) || degs[degs.length - 1];
  const faltam = Math.max(0, (p.acertosMeta || 45) - (p.acertosAtual || 0));
  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Rumo ao 45</h1><p>Hoje você faz ${p.acertosAtual} de 45. Para chegar a ${p.acertosMeta}, faltam ${faltam} acertos, e eles estão nas questões mais difíceis da prova. Suba a escada degrau por degrau.</p></div>
      <button class="btn" id="editar">${ic('target', 16)}Atualizar acertos</button></div>

    <div class="grade g3">
      <div class="cartao"><span class="rot">Último simulado de fora</span><div class="contagem" style="margin-top:6px"><span class="num">${p.acertosAtual}</span><span class="sub">de 45</span></div>${barra(p.acertosAtual, 45)}<p class="mini">Meta: ${p.acertosMeta} acertos</p></div>
      <div class="cartao"><span class="rot">Acertos esperados pelo IEM</span>
        ${r.esperado !== null ? `<div class="contagem" style="margin-top:6px"><span class="num">${Math.round(r.esperado)}</span><span class="sub">de 45</span></div>${barra(r.esperado, 45)}<p class="mini">Pela TRI, com as ${r.n} questões que você fez nos últimos 90 dias.</p>`
        : `<div class="contagem" style="margin-top:6px"><span class="num">—</span></div>${barra(r.n, MINIMO)}<p class="mini">Faça ${MINIMO - r.n} questões a mais para o IEM estimar.</p>`}</div>
      <div class="cartao"><span class="rot">Nota estimada (TRI)</span>
        <div class="contagem" style="margin-top:6px"><span class="num">${r.nota ?? '—'}</span><span class="sub">${r.nota ? 'pontos' : ''}</span></div>
        <p class="mini">${r.nota ? 'Escala oficial do ENEM, com os parâmetros publicados pelo INEP.' : 'Aparece junto com os acertos esperados.'}</p></div>
    </div>

    <section class="secao">
      <div class="entre" style="margin-bottom:8px;flex-wrap:wrap;gap:8px"><h2>A escada</h2><span class="sub">Degrau dominado: 80% de acerto nas últimas 15 respostas</span></div>
      <div class="escada">${degs.slice().reverse().map((d) => `
        <div class="degrau ${d.dominado ? 'dominado' : ''} ${d.atual ? 'atual' : ''}">
          <div class="degrau-num">${d.dominado ? ic('check', 18) : d.id}</div>
          <div class="degrau-txt">
            <div class="entre" style="gap:8px;flex-wrap:wrap"><b>${esc(d.rot)}</b><span class="mini">${d.qs.length} questões${d.atual ? ' · seu degrau agora' : ''}</span></div>
            <p class="mini">${esc(d.desc)} Mais comuns: ${d.assuntos.map(esc).join(', ')}.</p>
            <div class="degrau-barra"><span style="flex:1">${barra(d.certas, d.qs.length)}</span><span class="mini">${d.certas}/${d.qs.length} acertadas · ${d.n ? pct(Math.round(d.taxa * d.n), d.n) + '% recente' : 'sem respostas'}</span></div>
          </div>
          <button class="btn ${d.atual ? 'primario' : ''} peq" data-dg="${d.id}">${ic('play', 14)}Treinar 10</button>
        </div>`).join('')}</div>
    </section>

    <section class="secao cartao">
      <h3>Como usar</h3>
      <ul class="lista sub">
        <li>Comece pelo degrau marcado. Errou? Marque o motivo: o caderno de erros guarda a questão até você acertar.</li>
        <li>Na TRI, errar questão fácil derruba a nota. Por isso o primeiro degrau é a base: zero erro bobo.</li>
        <li>Nos degraus de cima, use "Pedir explicação" e transforme o método em flashcard.</li>
      </ul>
    </section>`;

  el.querySelectorAll('[data-dg]').forEach((b) => b.onclick = () => {
    const d = degs.find((x) => x.id === +b.dataset.dg);
    const ids = sessao(d);
    if (!ids.length) { toast('Nenhuma questão neste degrau'); return; }
    location.hash = '#/questoes/treino?modo=escada&ids=' + ids.join(',');
  });
  el.querySelector('#editar').onclick = () => {
    const { el: m, fechar } = janela('Seus acertos', `
      <label class="campo">Acertos em Matemática no último simulado (de 45)<input type="number" min="0" max="45" id="aa" value="${p.acertosAtual}"></label>
      <label class="campo">Meta de acertos<input type="number" min="1" max="45" id="am" value="${p.acertosMeta}"></label>
      <div class="linha-acoes"><span style="flex:1"></span><button class="btn primario" data-ok>Salvar</button></div>`);
    m.querySelector('[data-ok]').onclick = () => {
      const a = Math.max(0, Math.min(45, +m.querySelector('#aa').value || 0));
      const b = Math.max(1, Math.min(45, +m.querySelector('#am').value || 45));
      p.acertosAtual = a; p.acertosMeta = b; salvar(); fechar(); render(el); toast('Salvo');
    };
  };
}
