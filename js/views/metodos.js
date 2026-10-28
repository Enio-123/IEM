// Métodos de prova e como atacar cada assunto, com a frequência real de cada um no ENEM.
import { S } from '../store.js';
import { indice, situacao } from '../qbank.js';
import { METODOS, TOPICOS } from '../content.js';
import { ic } from '../icons.js';
import { esc, barra, pct } from '../ui.js';

export function render(el) {
  const anos = new Set(indice().map((m) => m.y)).size || 15;
  const sit = situacao();
  const dados = TOPICOS.map((t) => {
    const qs = indice().filter((m) => m.d === t.nome);
    const feitas = qs.filter((m) => sit.has(m.id));
    const certas = feitas.filter((m) => sit.get(m.id)).length;
    const dificeis = qs.filter((m) => m.nivel >= 800).length;
    return { ...t, total: qs.length, porProva: qs.length / anos, feitas: feitas.length, certas, dificeis };
  }).sort((a, b) => b.total - a.total);
  const max = Math.max(...dados.map((d) => d.porProva));
  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Métodos de prova</h1><p>Como fazer a prova de Matemática e como atacar cada assunto. A frequência vem das ${indice().length} questões do ENEM de 2009 a 2023.</p></div></div>

    <div class="grade g2">${METODOS.map((m, i) => `
      <div class="cartao"><div class="entre" style="justify-content:flex-start;gap:10px"><span class="degrau-num" style="width:28px;height:28px;font-size:13px">${i + 1}</span><h3>${esc(m.t)}</h3></div><p class="sub">${esc(m.d)}</p></div>`).join('')}
    </div>

    <section class="secao"><h2>Assunto por assunto</h2>
      <p class="sub" style="margin-bottom:10px">Ordenado pelo que mais cai. "Difíceis" são as questões com nível acima de 800 na escala do ENEM.</p>
      <div class="grade">${dados.map((d) => `
        <details class="cartao">
          <summary class="entre" style="gap:12px;cursor:pointer;flex-wrap:wrap">
            <b style="font-weight:500;flex:1;min-width:160px">${esc(d.nome)}</b>
            <span class="mini" style="width:150px">${barra(d.porProva, max)}</span>
            <span class="mini">${d.porProva.toFixed(1).replace('.', ',')} por prova · ${d.dificeis} difíceis</span>
          </summary>
          <p style="margin-top:12px">${esc(d.metodo)}</p>
          <div class="linha-acoes" style="align-items:center">
            <span class="sub" style="flex:1">${d.feitas ? `Você: ${d.certas}/${d.feitas} (${pct(d.certas, d.feitas)}%)` : 'Você ainda não fez questões deste assunto.'}</span>
            <a class="btn peq" href="#/cards">${ic('layers', 14)}Flashcards</a>
            <button class="btn primario peq" data-t="${esc(d.nome)}">${ic('zap', 14)}Treinar</button>
          </div>
        </details>`).join('')}
      </div>
    </section>`;
  el.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => {
    try { sessionStorage.setItem('iem-filtros', JSON.stringify({ materias: [b.dataset.t] })); } catch {}
    location.hash = '#/questoes/treino?usar=filtros';
  });
}
