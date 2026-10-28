import { S, salvar, uid } from '../store.js';
import { indice, questao, htmlQuestao, embaralhar, meta, transformacoes, rotuloQuestao } from '../qbank.js';
import { estimarNota, errosQuePesam } from '../tri.js';
import { AREAS, nomeMateria } from '../content.js';
import { ic } from '../icons.js';
import { esc, fmtTempo, confirmar, vazio, pct, toast, barra } from '../ui.js';
import { registrarResposta } from './questoes.js';

const FORMATOS = {
  prova: { rot: 'Prova inteira', desc: 'As 45 questões de Matemática de um ENEM, na ordem original.' },
  mista: { rot: 'Prova mista', desc: '45 questões sorteadas de todos os anos.' },
  dificeis: { rot: 'As mais difíceis', desc: '45 sorteadas entre as 90 mais difíceis já aplicadas. Treino para o 45.' },
};
const TEMPOS = [[135, '2h15 (3 min por questão)'], [150, '2h30 (metade do 2º dia)'], [180, '3h'], [90, '1h30 (ritmo forte)']];

export function render(el, partes) {
  if (partes[0] === 'r' && partes[1]) return resultado(el, partes[1]);
  const andando = S.simulados.find((s) => !s.fim);
  if (partes[0] === 'rodar' && andando) return rodar(el, andando);
  return configurar(el, andando);
}

function montarQuestoes(formato, ano) {
  const base = indice();
  if (formato === 'prova') return base.filter((m) => m.y === ano).sort((a, b) => a.n - b.n).map((m) => m.id);
  if (formato === 'dificeis') return embaralhar(base.filter((m) => m.nivel).sort((a, b) => b.nivel - a.nivel).slice(0, 90)).slice(0, 45).map((m) => m.id);
  return embaralhar(base).slice(0, 45).map((m) => m.id);
}

function configurar(el, andando) {
  const sel = { formato: 'prova', ano: 2023, min: 150 };
  const desenhar = () => {
    const anteriores = S.simulados.filter((s) => s.fim).slice(-10).reverse();
    el.innerHTML = `
      <a href="#/questoes" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Questões</a>
      <div class="topo-pagina"><div><h1>Simulado</h1><p>Faça como no dia: sem consulta, no tempo, e só confira no final. No ENEM, o 2º dia tem 5 horas para 90 questões (Natureza e Matemática).</p></div></div>
      ${andando ? `<div class="cartao entre secao" style="margin-top:0;margin-bottom:16px;flex-wrap:wrap"><div><b>Simulado em andamento</b><div class="sub">${esc(andando.titulo)} · ${Object.keys(andando.resp).length}/${andando.ids.length} respondidas</div></div>
        <div class="linha-acoes" style="margin:0"><button class="btn" id="descartar">Descartar</button><a class="btn primario" href="#/questoes/simulado/rodar">Continuar</a></div></div>` : ''}
      <div class="cartao grade">
        <div class="grupo filtros"><span class="rot">Formato</span>
          <div class="grade g3">${Object.entries(FORMATOS).map(([k, v]) => `<button class="cartao clicavel" data-f="${k}" style="${sel.formato === k ? 'border-color:var(--txt);box-shadow:inset 0 0 0 1px var(--txt)' : ''}"><b>${v.rot}</b><p class="mini" style="margin-top:6px">${v.desc}</p></button>`).join('')}</div>
        </div>
        ${sel.formato === 'prova' ? `<div class="grupo filtros"><span class="rot">Prova</span>
          <select id="ano" style="max-width:320px">${Array.from({ length: 15 }, (_, i) => 2023 - i).map((a) => `<option value="${a}" ${sel.ano === a ? 'selected' : ''}>ENEM ${a}</option>`).join('')}</select></div>` : ''}
        <div class="grupo filtros"><span class="rot">Tempo</span><div class="seg">${TEMPOS.map(([m, r]) => `<button class="${sel.min === m ? 'on' : ''}" data-min="${m}">${r}</button>`).join('')}</div></div>
        <div class="linha-acoes"><span style="flex:1"></span><button class="btn primario grande" id="iniciar" ${andando ? 'disabled title="Termine ou descarte o simulado em andamento"' : ''}>${ic('play', 18)}Iniciar simulado</button></div>
      </div>
      <section class="secao"><h2>Simulados feitos</h2>
        ${anteriores.length ? `<div class="cartao" style="padding:4px 18px"><ul class="lista">${anteriores.map((s) => `<li><a class="cresce" href="#/questoes/simulado/r/${s.id}" style="text-decoration:none"><b style="font-weight:500">${esc(s.titulo)}</b><div class="mini">${new Date(s.fim).toLocaleDateString('pt-BR')}</div></a>
          <span class="sub">${s.acertos}/${s.ids.length} · ${s.notas && s.notas.MT ? s.notas.MT + ' pts' : '—'}</span></li>`).join('')}</ul></div>` : vazio('Nenhum simulado ainda', 'O primeiro simulado mostra de onde você está partindo.')}
      </section>`;
    el.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { sel.formato = b.dataset.f; desenhar(); });
    el.querySelectorAll('[data-min]').forEach((b) => b.onclick = () => { sel.min = +b.dataset.min; desenhar(); });
    const anoSel = el.querySelector('#ano'); if (anoSel) anoSel.onchange = (e) => { sel.ano = +e.target.value; };
    const d = el.querySelector('#descartar');
    if (d) d.onclick = async () => { if (await confirmar('Descartar o simulado em andamento? As respostas dele serão perdidas.', 'Descartar')) { S.simulados = S.simulados.filter((s) => s !== andando); salvar(); andando = null; desenhar(); } };
    el.querySelector('#iniciar').onclick = () => {
      const ids = montarQuestoes(sel.formato, sel.ano);
      if (!ids.length) { toast('Não encontrei questões para essa combinação'); return; }
      const titulo = sel.formato === 'prova' ? `Matemática · ENEM ${sel.ano}` : `Matemática · ${FORMATOS[sel.formato].rot}`;
      const s = { id: uid(), titulo, formato: sel.formato, ano: sel.formato === 'prova' ? sel.ano : null, ids, resp: {}, marcadas: [], tempos: {}, inicio: Date.now(), limite: sel.min * 60000, gasto: 0, fim: null };
      S.simulados.push(s); salvar();
      location.hash = '#/questoes/simulado/rodar';
    };
  };
  desenhar();
}

function rodar(el, s) {
  let i = s.atual || 0;
  let entrada = Date.now();
  let dados = null;
  const restante = () => s.limite - (s.gasto + (Date.now() - s.retomado));
  s.retomado = Date.now();
  const relogio = setInterval(() => {
    const r = restante();
    const t = el.querySelector('#relogio'); if (t) t.textContent = fmtTempo(r / 1000);
    if (r <= 0) { clearInterval(relogio); toast('Tempo esgotado'); finalizar(); }
  }, 1000);
  const guardarTempo = () => { const id = s.ids[i]; s.tempos[id] = (s.tempos[id] || 0) + (Date.now() - entrada); entrada = Date.now(); };
  const ir = async (n) => {
    guardarTempo();
    i = Math.max(0, Math.min(s.ids.length - 1, n)); s.atual = i; salvar();
    await carregar(); window.scrollTo(0, 0);
  };
  const carregar = async () => {
    el.querySelector('#q').innerHTML = '<div class="carregando">Carregando…</div>';
    dados = await questao(s.ids[i]);
    desenharQ();
  };
  const desenharQ = () => {
    const m = dados.m;
    el.querySelector('#q').innerHTML = htmlQuestao(dados, { resp: s.resp[m.id], numero: `${i + 1}/${s.ids.length}` });
    el.querySelectorAll('#q [data-alt]').forEach((b) => b.onclick = () => {
      s.resp[m.id] = s.resp[m.id] === b.dataset.alt ? undefined : b.dataset.alt;
      if (!s.resp[m.id]) delete s.resp[m.id];
      salvar(); desenharQ(); grade();
    });
    el.querySelector('#marcar').classList.toggle('primario', s.marcadas.includes(m.id));
    grade();
  };
  const grade = () => {
    el.querySelector('#grade').innerHTML = s.ids.map((id, k) => `<button class="${s.resp[id] ? 'resp' : ''} ${k === i ? 'atual' : ''} ${s.marcadas.includes(id) ? 'marcada' : ''}" data-k="${k}" aria-label="Questão ${k + 1}">${k + 1}</button>`).join('');
    el.querySelectorAll('#grade [data-k]').forEach((b) => b.onclick = () => ir(+b.dataset.k));
    el.querySelector('#cont').textContent = `${Object.keys(s.resp).length}/${s.ids.length} respondidas`;
  };
  const finalizar = () => {
    clearInterval(relogio);
    guardarTempo();
    s.gasto += Date.now() - s.retomado;
    s.fim = Date.now();
    let acertos = 0;
    const porArea = {};
    for (const id of s.ids) {
      const m = meta(id); if (!m) continue;
      const letra = s.resp[id];
      const ok = letra ? registrarResposta(m, letra, s.tempos[id] || 0, 'simulado', s.id) : false;
      if (!letra) { // em branco conta como erro para a TRI e vai para o caderno
        S.erros[id] = S.erros[id] || { motivo: 'tempo', nota: '', em: Date.now(), resolvido: false };
      }
      if (ok) acertos++;
      (porArea[m.ar] = porArea[m.ar] || []).push({ id, p: m.p, ok });
    }
    s.acertos = acertos;
    s.notas = {};
    for (const [a, itens] of Object.entries(porArea)) s.notas[a] = estimarNota(itens, transformacoes(), a, s.ano);
    salvar();
    location.hash = '#/questoes/simulado/r/' + s.id;
  };
  el.innerHTML = `
    <div class="entre" style="margin-bottom:16px;flex-wrap:wrap;gap:8px"><div><b>${esc(s.titulo)}</b><div class="sub" id="cont"></div></div>
      <div class="entre"><span class="relogio" id="relogio">${fmtTempo(restante() / 1000)}</span></div></div>
    <div class="sim-layout">
      <div><div id="q"></div>
        <div class="barra-questao"><button class="btn" id="ant">${ic('chevron-left', 16)}Anterior</button>
        <button class="btn" id="marcar">${ic('flag', 16)}Revisar depois</button>
        <button class="btn" id="prox">Próxima${ic('chevron-right', 16)}</button></div></div>
      <aside class="sim-mapa"><div class="entre" style="margin-bottom:10px"><span class="rot">Folha de respostas</span></div><div class="sim-grade" id="grade"></div>
        <div class="linha-acoes"><a class="btn peq" href="#/questoes/simulado">Pausar</a><button class="btn primario peq" id="fim">Entregar</button></div>
        <p class="mini" style="margin-top:10px">Preenchida = respondida · tracejada = marcada para revisar</p></aside>
    </div>`;
  el.querySelector('#ant').onclick = () => ir(i - 1);
  el.querySelector('#prox').onclick = () => ir(i + 1);
  el.querySelector('#marcar').onclick = () => {
    const id = s.ids[i]; s.marcadas = s.marcadas.includes(id) ? s.marcadas.filter((x) => x !== id) : [...s.marcadas, id]; salvar(); desenharQ();
  };
  el.querySelector('#fim').onclick = async () => {
    const branco = s.ids.length - Object.keys(s.resp).length;
    if (await confirmar(branco ? `Ainda há ${branco} questões em branco. No ENEM, chutar é melhor que deixar em branco. Entregar mesmo assim?` : 'Entregar o simulado e ver o resultado?', 'Entregar')) finalizar();
  };
  carregar();
  return () => { clearInterval(relogio); if (!s.fim) { guardarTempo(); s.gasto += Date.now() - s.retomado; salvar(); } };
}

function resultado(el, id) {
  const s = S.simulados.find((x) => x.id === id);
  if (!s) { el.innerHTML = vazio('Simulado não encontrado', ''); return; }
  const tr = transformacoes();
  const porArea = {};
  for (const qid of s.ids) {
    const m = meta(qid); if (!m) continue;
    const ok = s.resp[qid] === m.g;
    (porArea[m.ar] = porArea[m.ar] || []).push({ id: qid, p: m.p, ok, m, t: s.tempos[qid] || 0 });
  }
  const tempoMedio = s.ids.length ? s.gasto / s.ids.length / 1000 : 0;
  el.innerHTML = `
    <a href="#/questoes/simulado" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Simulados</a>
    <div class="topo-pagina"><div><h1>${esc(s.titulo)}</h1><p>${new Date(s.fim).toLocaleString('pt-BR')} · ${fmtTempo(s.gasto / 1000)} de prova · ${fmtTempo(tempoMedio)} por questão</p></div></div>
    <div class="grade g3">
      <div class="cartao"><span class="rot">Acertos</span><div class="num">${s.acertos}<small>/${s.ids.length}</small></div><p class="mini">${pct(s.acertos, s.ids.length)}%</p></div>
      <div class="cartao"><span class="rot">Meta</span><div class="num">${S.perfil.acertosMeta}<small>/45</small></div><p class="mini">${s.ids.length === 45 ? (s.acertos >= S.perfil.acertosMeta ? 'Bateu a meta' : `Faltaram ${S.perfil.acertosMeta - s.acertos}`) : ''}</p></div>
      ${Object.entries(porArea).map(([a, it]) => `<div class="cartao"><span class="rot">Nota ${AREAS[a].nome}</span><div class="num">${s.notas[a] ?? '—'}</div><p class="mini">${it.filter((x) => x.ok).length}/${it.length} acertos · nota estimada</p></div>`).join('')}
    </div>
    <p class="aviso secao">A nota é uma estimativa pela TRI com os parâmetros oficiais do INEP. A nota real pode variar alguns pontos, principalmente em provas mistas.</p>
    ${porAssunto(s)}
    ${Object.entries(porArea).map(([a, it]) => {
      const pesam = errosQuePesam(it, tr, a, s.ano).slice(0, 5);
      return pesam.length ? `<section class="secao"><h2>Erros que mais derrubaram a nota</h2><p class="sub" style="margin-bottom:10px">Na TRI, errar questão fácil pesa mais. Estas são as mais fáceis que você errou.</p>
        <div class="cartao" style="padding:4px 18px"><ul class="lista">${pesam.map((x) => `<li><a class="cresce" href="#/questoes/q/${x.id}">${rotuloQuestao(x.m)} · ${esc(nomeMateria(x.m.ar, x.m.d))}</a><span class="sub">nível ${x.nivel}</span></li>`).join('')}</ul></div></section>` : '';
    }).join('')}
    <section class="secao"><h2>Gabarito</h2><div class="cartao"><div class="sim-grade" style="grid-template-columns:repeat(auto-fill,minmax(64px,1fr));max-height:none">
      ${s.ids.map((qid, k) => { const m = meta(qid); const r = s.resp[qid]; const ok = r === m.g; return `<a href="#/questoes/q/${qid}" class="btn peq" style="${ok ? 'background:var(--txt);color:var(--inv-txt)' : 'border-style:dashed'}" title="Sua: ${r || 'branco'} · Gabarito: ${m.g}">${k + 1} ${r || '–'}${ok ? '' : '/' + m.g}</a>`; }).join('')}
    </div><p class="mini" style="margin-top:10px">Preenchido = acerto. Tracejado = erro (sua / gabarito). Todas as erradas já foram para o caderno de erros.</p></div></section>`;
}

function porAssunto(s) {
  const t = {};
  for (const qid of s.ids) {
    const m = meta(qid); if (!m) continue;
    t[m.d] = t[m.d] || { a: 0, n: 0 };
    t[m.d].n++; if (s.resp[qid] === m.g) t[m.d].a++;
  }
  const l = Object.entries(t).sort((x, y) => (x[1].a / x[1].n) - (y[1].a / y[1].n) || y[1].n - x[1].n);
  return `<section class="secao"><h2>Por assunto</h2><div class="cartao" style="padding:4px 18px"><ul class="lista">${l.map(([d, x]) => `<li><span class="cresce">${esc(d)}</span><span style="width:90px">${barra(x.a, x.n)}</span><b style="width:52px;text-align:right">${x.a}/${x.n}</b></li>`).join('')}</ul></div></section>`;
}
