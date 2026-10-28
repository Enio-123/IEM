import { S, hojeStr, addDias } from '../store.js';
import { meta, indice } from '../qbank.js';
import { TOPICOS } from '../content.js';
import { retrato, MINIMO } from '../meta45.js';
import { estadoDegraus } from './escada.js';
import { ic } from '../icons.js';
import { esc, pct, barra, colunas } from '../ui.js';

export function render(el) {
  const resp = S.respostas;
  const p = S.perfil;
  const r = retrato();
  const ult = new Map(); resp.forEach((x) => ult.set(x.qid, x));
  // Desempenho por assunto (última tentativa de cada questão) e prioridade = frequência × erro.
  const anos = new Set(indice().map((m) => m.y)).size || 15;
  const freq = {}; indice().forEach((m) => { freq[m.d] = (freq[m.d] || 0) + 1; });
  const mat = {};
  for (const x of ult.values()) {
    const m = meta(x.qid); if (!m) continue;
    mat[m.d] = mat[m.d] || { a: 0, n: 0 };
    mat[m.d].n++; if (x.ok) mat[m.d].a++;
  }
  const topicos = TOPICOS.map((t) => {
    const x = mat[t.nome] || { a: 0, n: 0 };
    const porProva = (freq[t.nome] || 0) / anos;
    const erro = x.n >= 3 ? 1 - x.a / x.n : null;
    return { nome: t.nome, ...x, porProva, erro, prioridade: erro === null ? null : porProva * erro };
  });
  const focar = topicos.filter((t) => t.prioridade !== null && t.erro > 0).sort((a, b) => b.prioridade - a.prioridade).slice(0, 5);
  // Simulados: evolução de acertos.
  const sims = S.simulados.filter((s) => s.fim && s.ids.length === 45).slice(-10);
  // Histórico de 8 semanas.
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const fim = addDias(hojeStr(), -7 * (7 - i)); let q = 0, c = 0, min = 0;
    for (let d = 0; d < 7; d++) { const x = S.dias[addDias(fim, -d)]; if (x) { q += x.questoes || 0; c += x.cards || 0; min += x.min || 0; } }
    return { rot: fim.slice(8) + '/' + fim.slice(5, 7), q, c, min };
  });
  const fx = { facil: [0, 0], media: [0, 0], dificil: [0, 0], muito: [0, 0] };
  for (const x of ult.values()) { const m = meta(x.qid); if (m && fx[m.fx]) { fx[m.fx][1]++; if (x.ok) fx[m.fx][0]++; } }
  const degs = estadoDegraus();

  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Progresso</h1><p>${resp.length.toLocaleString('pt-BR')} respostas · ${ult.size} questões diferentes de ${indice().length} · ${S.focos.reduce((s, f) => s + f.min, 0)} min de foco</p></div>
      <a class="btn" href="#/escada">${ic('trending-up', 16)}Rumo ao 45</a></div>

    <div class="cartao">
      <div class="entre" style="flex-wrap:wrap;gap:16px">
        <div><span class="rot">Acertos esperados numa prova real</span>
          <div class="contagem" style="margin-top:6px"><span class="num" style="font-size:40px">${r.esperado !== null ? Math.round(r.esperado) : '—'}</span><span class="sub">de 45 · meta ${p.acertosMeta}</span></div></div>
        <div><span class="rot">Nota estimada (TRI)</span><div class="num" style="font-size:28px;margin-top:6px">${r.nota ?? '—'}</div></div>
        <div><span class="rot">Último simulado de fora</span><div class="num" style="font-size:28px;margin-top:6px">${p.acertosAtual}<small>/45</small></div></div>
      </div>
      <div style="margin-top:14px">${barra(r.esperado ?? 0, p.acertosMeta)}</div>
      <p class="mini" style="margin-top:10px">${r.esperado !== null ? `Calculado pela TRI com as ${r.n} questões que você fez nos últimos 90 dias e os parâmetros oficiais das provas de 2021 a 2023.` : `Faça pelo menos ${MINIMO} questões (faltam ${MINIMO - r.n}) para o IEM estimar seus acertos e sua nota.`}</p>
    </div>

    <div class="grade g2 secao">
      <div class="cartao"><h3>Onde focar agora</h3>
        ${focar.length ? `<ul class="lista">${focar.map((x) => `<li><span class="cresce">${esc(x.nome)}<div class="mini">cai ${x.porProva.toFixed(1).replace('.', ',')} por prova · você erra ${Math.round(x.erro * 100)}%</div></span><span style="width:80px">${barra(x.a, x.n)}</span><b style="width:42px;text-align:right">${pct(x.a, x.n)}%</b></li>`).join('')}</ul>
          <p class="mini" style="margin-top:8px">Ordem: quanto o assunto cai na prova vezes quanto você erra.</p>`
          : '<p class="sub">Responda algumas questões de cada assunto para ver aqui onde focar.</p>'}
      </div>
      <div class="cartao"><h3>Acerto por dificuldade</h3>
        <ul class="lista">${[['facil', 'Fácil (até 550)'], ['media', 'Média (550 a 650)'], ['dificil', 'Difícil (650 a 750)'], ['muito', 'Muito difícil (750+)']].map(([k, rr]) => `<li><span class="cresce">${rr}<div class="mini">${fx[k][1]} questões</div></span><span style="width:80px">${barra(fx[k][0], fx[k][1])}</span><b style="width:42px;text-align:right">${fx[k][1] ? pct(fx[k][0], fx[k][1]) + '%' : '—'}</b></li>`).join('')}</ul>
        <p class="mini" style="margin-top:8px">Na TRI, garantir as fáceis e médias vale mais do que acertar difíceis no chute.</p>
      </div>
    </div>

    <section class="secao grade g2">
      <div class="cartao"><h3>Escada</h3><ul class="lista">${degs.map((d) => `<li><span class="cresce">${esc(d.rot)}<div class="mini">${d.dominado ? 'dominado' : d.atual ? 'seu degrau agora' : d.feitas ? `${d.feitas} feitas` : 'pela frente'}</div></span><span style="width:80px">${barra(d.certas, d.qs.length)}</span><b style="width:52px;text-align:right">${d.certas}/${d.qs.length}</b></li>`).join('')}</ul></div>
      <div class="cartao"><h3>Simulados de 45</h3>${sims.length ? colunas(sims.map((s) => ({ rot: new Date(s.fim).toLocaleDateString('pt-BR').slice(0, 5), v: s.acertos }))) + `<p class="mini" style="margin-top:8px">Acertos em cada simulado. Meta: ${p.acertosMeta}.</p>` : '<p class="sub">Faça um simulado de 45 questões para começar o gráfico.</p>'}</div>
    </section>

    <section class="secao grade g3">
      <div class="cartao"><h3>Questões por semana</h3>${colunas(semanas.map((s) => ({ rot: s.rot, v: s.q })))}</div>
      <div class="cartao"><h3>Cards por semana</h3>${colunas(semanas.map((s) => ({ rot: s.rot, v: s.c })))}</div>
      <div class="cartao"><h3>Horas de foco</h3>${colunas(semanas.map((s) => ({ rot: s.rot, v: Math.round(s.min / 6) / 10 })))}</div>
    </section>

    <section class="secao"><h2>Todos os assuntos</h2>
      <div class="cartao" style="padding:4px 18px"><ul class="lista">${topicos.slice().sort((a, b) => b.porProva - a.porProva).map((x) => `<li><span class="cresce">${esc(x.nome)}<div class="mini">${x.porProva.toFixed(1).replace('.', ',')} por prova</div></span><span class="mini">${x.n} feitas</span><span style="width:80px">${barra(x.a, x.n || 1)}</span><b style="width:42px;text-align:right">${x.n ? pct(x.a, x.n) + '%' : '—'}</b></li>`).join('')}</ul></div>
    </section>`;
}
