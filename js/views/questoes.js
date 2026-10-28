import { S, salvar, registrarDia, hojeStr } from '../store.js';
import { filtrar, questao, htmlQuestao, promptExplicacao, embaralhar, meta, rotuloQuestao, situacao, indice } from '../qbank.js';
import { AREAS, TOPICOS, nomeMateria } from '../content.js';
import { ic } from '../icons.js';
import { esc, janela, toast, copiar, vazio, pct, md } from '../ui.js';
import { editarCard } from './cards.js';

export const MOTIVOS = [
  { id: 'conteudo', rot: 'Não sabia o conteúdo' },
  { id: 'interpretacao', rot: 'Interpretei errado' },
  { id: 'atencao', rot: 'Falta de atenção' },
  { id: 'calculo', rot: 'Erro de cálculo' },
  { id: 'tempo', rot: 'Falta de tempo / chute' },
];
const FAIXAS = [['facil', 'Fácil'], ['media', 'Média'], ['dificil', 'Difícil'], ['muito', 'Muito difícil']];
const ANOS = Array.from({ length: 15 }, (_, i) => 2023 - i);

export async function render(el, partes, params) {
  if (partes[0] === 'simulado') { const m = await import('./simulado.js'); return m.render(el, partes.slice(1), params); }
  if (partes[0] === 'q') return verQuestao(el, partes[1]);
  if (partes[0] === 'treino') return treino(el, params);
  if (partes[0] === 'banco') return banco(el);
  if (partes[0] === 'erros') return caderno(el);
  return hub(el);
}

// Registra a resposta e cuida do caderno de erros.
export function registrarResposta(m, letra, ms, modo, sim = null) {
  const ok = letra === m.g;
  S.respostas.push({ qid: m.id, esc: letra, ok, ms: Math.round(ms), em: Date.now(), modo, sim });
  registrarDia('questoes');
  if (modo === 'escada') registrarDia('escada');
  if (modo === 'erros') registrarDia('refeitas');
  if (!ok && !S.erros[m.id]) S.erros[m.id] = { motivo: null, nota: '', em: Date.now(), resolvido: false };
  if (ok && S.erros[m.id] && !S.erros[m.id].resolvido) { S.erros[m.id].resolvido = true; S.erros[m.id].resolvidoEm = Date.now(); }
  salvar();
  return ok;
}

function hub(el) {
  const total = indice().length;
  const sit = situacao();
  const feitas = sit.size, certas = [...sit.values()].filter(Boolean).length;
  const pend = Object.values(S.erros).filter((e) => !e.resolvido).length;
  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Questões</h1><p>Todas as ${total.toLocaleString('pt-BR')} questões de Matemática do ENEM de 2009 a 2023, separadas por assunto e com a dificuldade calculada pelos parâmetros da TRI publicados pelo INEP.</p></div></div>
    <div class="grade g4">
      <div class="cartao"><span class="rot">Feitas</span><div class="num">${feitas}</div><p class="mini">de ${total.toLocaleString('pt-BR')}</p></div>
      <div class="cartao"><span class="rot">Acerto</span><div class="num">${pct(certas, feitas)}%</div><p class="mini">última tentativa de cada</p></div>
      <div class="cartao"><span class="rot">Caderno de erros</span><div class="num">${pend}</div><p class="mini">para refazer</p></div>
      <div class="cartao"><span class="rot">Simulados</span><div class="num">${S.simulados.filter((s) => s.fim).length}</div><p class="mini">concluídos</p></div>
    </div>
    <div class="grade g2 secao">
      <a class="cartao clicavel" href="#/escada" style="text-decoration:none"><div class="entre"><h3>Rumo ao 45</h3>${ic('trending-up')}</div><p class="sub">Escada das questões mais difíceis, degrau por degrau, até as que quase ninguém acerta.</p></a>
      <a class="cartao clicavel" href="#/questoes/treino" style="text-decoration:none"><div class="entre"><h3>Treino rápido</h3>${ic('zap')}</div><p class="sub">Questões com correção na hora. Escolha assunto e dificuldade.</p></a>
      <a class="cartao clicavel" href="#/questoes/simulado" style="text-decoration:none"><div class="entre"><h3>Simulado</h3>${ic('clock')}</div><p class="sub">45 questões no tempo, de uma prova inteira, mista ou só as mais difíceis, com nota pela TRI.</p></a>
      <a class="cartao clicavel" href="#/questoes/banco" style="text-decoration:none"><div class="entre"><h3>Banco de questões</h3>${ic('search')}</div><p class="sub">Filtre por ano, assunto, dificuldade e situação.</p></a>
      <a class="cartao clicavel" href="#/questoes/erros" style="text-decoration:none"><div class="entre"><h3>Caderno de erros</h3>${ic('bookmark')}</div><p class="sub">Toda questão errada fica aqui com o motivo do erro, até você acertar.</p></a>
    </div>
    <p class="aviso secao">Os textos das questões vêm das provas oficiais do INEP, digitalizados pelo projeto aberto enem-api. Em poucas questões pode haver pequenos erros de digitalização ou imagem faltando. Os parâmetros de dificuldade são dos microdados oficiais do INEP.</p>`;
}

// Filtros reutilizados no banco e no treino.
function lerFiltros() { try { return JSON.parse(sessionStorage.getItem('iem-filtros')) || {}; } catch { return {}; } }
function gravarFiltros(f) { try { sessionStorage.setItem('iem-filtros', JSON.stringify(f)); } catch {} }

function painelFiltros(f, aoMudar) {
  const wrap = document.createElement('div');
  wrap.className = 'filtros';
  const desenhar = () => {
    wrap.innerHTML = `
      <div class="grupo"><span class="rot">Assunto</span><div class="chips">${TOPICOS.map((t) => `<button class="chip ${f.materias?.includes(t.nome) ? 'on' : ''}" data-g="materias" data-v="${esc(t.nome)}">${esc(t.nome)}</button>`).join('')}</div></div>
      <div class="grupo"><span class="rot">Dificuldade (TRI)</span><div class="chips">${FAIXAS.map(([k, v]) => `<button class="chip ${f.faixas?.includes(k) ? 'on' : ''}" data-g="faixas" data-v="${k}">${v}</button>`).join('')}</div></div>
      <div class="grupo"><span class="rot">Situação</span><div class="seg">${[['todas', 'Todas'], ['novas', 'Nunca feitas'], ['erradas', 'Errei'], ['certas', 'Acertei']].map(([k, v]) => `<button class="${(f.status || 'todas') === k ? 'on' : ''}" data-st="${k}">${v}</button>`).join('')}</div></div>
      <div class="grupo"><span class="rot">Anos</span><div class="chips">${ANOS.map((a) => `<button class="chip ${f.anos?.includes(a) ? 'on' : ''}" data-g="anos" data-v="${a}">${a}</button>`).join('')}</div></div>`;
    wrap.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => {
      const g = b.dataset.g; const v = g === 'anos' ? +b.dataset.v : b.dataset.v;
      const l = new Set(f[g] || []); l.has(v) ? l.delete(v) : l.add(v); f[g] = [...l];
      gravarFiltros(f); desenhar(); aoMudar();
    });
    wrap.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => { f.status = b.dataset.st; gravarFiltros(f); desenhar(); aoMudar(); });
  };
  desenhar();
  return wrap;
}

function banco(el) {
  const f = lerFiltros();
  let pagina = 0;
  el.innerHTML = `
    <a href="#/questoes" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Questões</a>
    <div class="topo-pagina"><div><h1>Banco de questões</h1><p id="cont"></p></div>
      <div class="linha-acoes" style="margin:0"><button class="btn" id="limpar">Limpar filtros</button><button class="btn primario" id="treinar">${ic('zap', 16)}Treinar 10 destas</button></div></div>
    <details class="cartao" open id="det"><summary class="entre"><b>${ic('filter', 16)}</b><span style="flex:1;margin-left:8px">Filtros</span></summary><div id="fil" style="margin-top:14px"></div></details>
    <div class="secao" id="lista"></div>`;
  const sit = situacao();
  const lista = () => {
    const r = filtrar(f).sort((a, b) => b.y - a.y || a.n - b.n);
    el.querySelector('#cont').textContent = `${r.length.toLocaleString('pt-BR')} questões encontradas`;
    const pag = r.slice(pagina * 40, pagina * 40 + 40);
    el.querySelector('#lista').innerHTML = r.length ? `
      <table class="tabela-q"><thead><tr><th></th><th>Questão</th><th>Assunto</th><th class="esconde-celular">Dificuldade</th></tr></thead><tbody>
      ${pag.map((m) => `<tr class="clicavel" data-id="${m.id}"><td><span class="marca-sit ${sit.has(m.id) ? (sit.get(m.id) ? 'certa' : 'errada') : ''}" title="${sit.has(m.id) ? (sit.get(m.id) ? 'Acertou' : 'Errou') : 'Nunca feita'}"></span></td>
        <td>ENEM ${m.y} · Q${m.n}</td><td>${esc(m.d)}</td><td class="esconde-celular">${m.nivel ? `${FAIXAS.find((x) => x[0] === m.fx)[1]} <span class="mini">(${m.nivel})</span>` : '<span class="mini">sem dado</span>'}</td></tr>`).join('')}
      </tbody></table>
      <div class="linha-acoes" style="justify-content:center">${pagina > 0 ? '<button class="btn" id="ant">Anterior</button>' : ''}<span class="sub">Página ${pagina + 1} de ${Math.ceil(r.length / 40)}</span>${(pagina + 1) * 40 < r.length ? '<button class="btn" id="prox">Próxima</button>' : ''}</div>`
      : vazio('Nenhuma questão com esses filtros', 'Tire algum filtro para ver mais.');
    el.querySelectorAll('tr[data-id]').forEach((t) => t.onclick = () => (location.hash = '#/questoes/q/' + t.dataset.id));
    const a = el.querySelector('#ant'); if (a) a.onclick = () => { pagina--; lista(); };
    const p = el.querySelector('#prox'); if (p) p.onclick = () => { pagina++; lista(); };
  };
  el.querySelector('#fil').appendChild(painelFiltros(f, () => { pagina = 0; lista(); }));
  el.querySelector('#limpar').onclick = () => { gravarFiltros({}); banco(el); };
  el.querySelector('#treinar').onclick = () => { location.hash = '#/questoes/treino?usar=filtros'; };
  if (innerWidth < 720) el.querySelector('#det').open = false;
  lista();
}

// Ações depois de responder: explicação por IA, flashcard, caderno de erros e anotação.
function acoesPosResposta(box, dados, letra, depois) {
  const { m, q } = dados;
  const ok = letra === q.g;
  const erro = S.erros[m.id];
  box.innerHTML = `
    <div class="feedback ${ok ? '' : 'erro'}">${ic(ok ? 'check' : 'x', 22)}<div style="flex:1">
      <b>${ok ? 'Acertou' : `Errou. Gabarito: ${q.g}`}</b>
      ${m.nivel ? `<div class="mini">Nível desta questão na escala do ENEM: ${m.nivel} pontos</div>` : ''}
      ${!ok ? `<div style="margin-top:10px"><span class="rot">Por que errei?</span><div class="chips" style="margin-top:6px">${MOTIVOS.map((x) => `<button class="chip ${erro && erro.motivo === x.id ? 'on' : ''}" data-motivo="${x.id}">${x.rot}</button>`).join('')}</div></div>` : ''}
    </div></div>
    <div class="linha-acoes">
      <button class="btn" data-a="explicar">${ic('sparkles', 16)}Pedir explicação</button>
      <button class="btn" data-a="card">${ic('layers', 16)}Criar flashcard</button>
      <button class="btn" data-a="nota">${ic('pencil', 16)}${S.notas[m.id] ? 'Ver anotação' : 'Anotar'}</button>
    </div>
    ${S.notas[m.id] ? `<div class="aviso">${esc(S.notas[m.id])}</div>` : ''}`;
  box.querySelectorAll('[data-motivo]').forEach((b) => b.onclick = () => { S.erros[m.id].motivo = b.dataset.motivo; salvar(); acoesPosResposta(box, dados, letra, depois); });
  box.querySelector('[data-a=explicar]').onclick = () => explicar(dados, letra);
  box.querySelector('[data-a=card]').onclick = () => {
    const deck = Object.values(S.decks).find((d) => d.area === m.ar && d.materia === m.d) || Object.values(S.decks)[0];
    editarCard(null, deck && deck.id, null, { frente: `${rotuloQuestao(m)}: o que eu preciso lembrar?`, verso: '', qid: m.id, origem: `ENEM ${m.y || ''}`.trim() });
  };
  box.querySelector('[data-a=nota]').onclick = () => {
    const { el: j, fechar } = janela('Anotação', `<textarea id="nt" rows="6" placeholder="O que você aprendeu com esta questão?">${esc(S.notas[m.id] || '')}</textarea><div class="linha-acoes"><span style="flex:1"></span><button class="btn primario" data-ok>Salvar</button></div>`);
    j.querySelector('[data-ok]').onclick = () => { const v = j.querySelector('#nt').value.trim(); if (v) S.notas[m.id] = v; else delete S.notas[m.id]; salvar(); fechar(); acoesPosResposta(box, dados, letra, depois); };
  };
}

export function explicar(dados, letra) {
  const p = promptExplicacao(dados, letra);
  const temImg = /\[imagem\]/.test(p);
  const { el } = janela('Pedir explicação a uma IA', `
    <p class="sub">O IEM monta o pedido com o enunciado, as alternativas e o gabarito. Copie e cole no assistente que preferir, ou abra direto.</p>
    ${temImg ? '<p class="aviso">Esta questão tem imagem. Se a imagem for importante, tire um print dela e envie junto.</p>' : ''}
    <textarea rows="8" readonly>${esc(p)}</textarea>
    <div class="linha-acoes"><button class="btn primario" data-copiar>${ic('copy', 16)}Copiar pedido</button>
    <a class="btn" target="_blank" rel="noopener" href="https://claude.ai/new?q=${encodeURIComponent(p)}">${ic('external-link', 16)}Abrir no Claude</a>
    <a class="btn" target="_blank" rel="noopener" href="https://chatgpt.com/?q=${encodeURIComponent(p)}">${ic('external-link', 16)}Abrir no ChatGPT</a></div>`, { largo: true });
  el.querySelector('[data-copiar]').onclick = async () => toast((await copiar(p)) ? 'Pedido copiado' : 'Não consegui copiar');
}

async function verQuestao(el, id) {
  const dados = await questao(id).catch(() => null);
  if (!dados || !dados.q) { el.innerHTML = vazio('Questão não encontrada', ''); return; }
  let inicio = Date.now(), resp = null;
  const desenhar = () => {
    el.innerHTML = `<a href="javascript:history.back()" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Voltar</a>
      ${htmlQuestao(dados, { resp, revelar: !!resp })}<div id="pos" class="secao"></div>`;
    if (!resp) el.querySelectorAll('[data-alt]').forEach((b) => b.onclick = () => {
      resp = b.dataset.alt; registrarResposta(dados.m, resp, Date.now() - inicio, 'avulsa'); desenhar();
    });
    else acoesPosResposta(el.querySelector('#pos'), dados, resp);
  };
  desenhar();
}

// Treino: sequência curta com correção imediata.
async function treino(el, params) {
  let f = params.usar === 'filtros' ? lerFiltros() : (params.ids ? null : { status: 'novas' });
  let ids = [];
  const montar = () => {
    let base = filtrar(f);
    if (f.ordem === 'dificeis') base = base.filter((m) => m.nivel).sort((a, b) => b.nivel - a.nivel).slice(0, 60);
    ids = embaralhar(base).slice(0, f.qtd || 10).map((m) => m.id);
  };
  if (params.ids) ids = params.ids.split(',');
  if (!params.ids && params.usar !== 'filtros') {
    // Tela de escolha rápida.
    f.qtd = 10;
    el.innerHTML = `
      <a href="#/questoes" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Questões</a>
      <div class="topo-pagina"><div><h1>Treino rápido</h1><p>Escolha o foco. Sem filtro, o IEM sorteia questões de Matemática que você nunca fez.</p></div></div>
      <div class="cartao" id="fil"></div>
      <div class="cartao secao"><div class="grupo filtros"><span class="rot">Ordem</span><div class="seg" id="ordem"><button class="on" data-o="">Aleatória</button><button data-o="dificeis">Só as mais difíceis</button></div>
      <span class="rot" style="margin-top:8px">Quantidade</span><div class="seg" id="qtd">${[5, 10, 20, 45].map((n) => `<button class="${n === 10 ? 'on' : ''}" data-q="${n}">${n}</button>`).join('')}</div></div>
      <div class="linha-acoes"><span id="disp" class="sub"></span><span style="flex:1"></span><button class="btn primario grande" id="ir">${ic('play', 18)}Começar</button></div></div>`;
    const disp = () => { el.querySelector('#disp').textContent = `${filtrar(f).length.toLocaleString('pt-BR')} questões disponíveis`; };
    el.querySelector('#fil').appendChild(painelFiltros(f, disp)); disp();
    el.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => { f.ordem = b.dataset.o; el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === b)); });
    el.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { f.qtd = +b.dataset.q; el.querySelectorAll('[data-q]').forEach((x) => x.classList.toggle('on', x === b)); });
    el.querySelector('#ir').onclick = () => { montar(); if (!ids.length) { toast('Nenhuma questão com esses filtros'); return; } rodar(); };
    return;
  }
  if (!ids.length) montar();
  if (!ids.length) { el.innerHTML = vazio('Nenhuma questão com esses filtros', '', '<a class="btn" href="#/questoes/treino">Escolher de novo</a>'); return; }
  rodar();

  async function rodar() {
    let i = 0, acertos = 0, resp = null, inicio = Date.now();
    const resultados = [];
    const passo = async () => {
      if (i >= ids.length) return fim();
      el.innerHTML = '<div class="carregando">Carregando questão…</div>';
      const dados = await questao(ids[i]);
      resp = null; inicio = Date.now();
      const desenhar = () => {
        el.innerHTML = `${htmlQuestao(dados, { resp, revelar: !!resp, numero: `${i + 1}/${ids.length}` })}<div id="pos" class="secao"></div>
          <div class="barra-questao"><a class="btn fantasma" href="#/questoes">Sair</a><span class="sub">${acertos} acerto${acertos === 1 ? '' : 's'}</span>
          <button class="btn primario" id="prox" ${resp ? '' : 'disabled'}>${i + 1 < ids.length ? 'Próxima' : 'Ver resultado'}${ic('chevron-right', 16)}</button></div>`;
        if (!resp) el.querySelectorAll('[data-alt]').forEach((b) => b.onclick = () => {
          resp = b.dataset.alt;
          const ok = registrarResposta(dados.m, resp, Date.now() - inicio, params.modo || 'treino');
          if (ok) acertos++;
          resultados.push({ id: dados.m.id, ok });
          desenhar();
        });
        else acoesPosResposta(el.querySelector('#pos'), dados, resp);
        el.querySelector('#prox').onclick = () => { i++; passo(); window.scrollTo(0, 0); };
      };
      desenhar();
    };
    const fim = () => {
      el.innerHTML = `<div class="estudo"><div class="cartao" style="text-align:center;padding:32px">
        <span class="rot">Resultado</span><div class="num" style="font-size:52px;margin:8px 0">${acertos}/${ids.length}</div>
        <p class="sub">${pct(acertos, ids.length)}% de acerto</p>
        <ul class="lista" style="text-align:left;margin-top:18px">${resultados.map((r) => { const m = meta(r.id); return `<li>${ic(r.ok ? 'check' : 'x', 16)}<a class="cresce" href="#/questoes/q/${r.id}">${rotuloQuestao(m)} · ${esc(nomeMateria(m.ar, m.d))}</a></li>`; }).join('')}</ul>
        <div class="linha-acoes" style="justify-content:center"><a class="btn" href="#/questoes/erros">Caderno de erros</a><button class="btn primario" id="denovo">Outro treino</button></div></div></div>`;
      el.querySelector('#denovo').onclick = () => { location.hash = params.modo === 'escada' ? '#/escada' : '#/questoes/treino?t=' + Date.now(); };
    };
    passo();
  }
}

function caderno(el) {
  let mostrar = 'pendentes';
  const desenhar = () => {
    const todos = Object.entries(S.erros).map(([id, e]) => ({ id, ...e, m: meta(id) })).filter((x) => x.m).sort((a, b) => b.em - a.em);
    const lista = todos.filter((x) => (mostrar === 'pendentes' ? !x.resolvido : x.resolvido));
    const porMotivo = {};
    todos.filter((x) => !x.resolvido).forEach((x) => { porMotivo[x.motivo || 'sem'] = (porMotivo[x.motivo || 'sem'] || 0) + 1; });
    el.innerHTML = `
      <a href="#/questoes" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Questões</a>
      <div class="topo-pagina"><div><h1>Caderno de erros</h1><p>Cada questão errada fica aqui até você acertar ao refazer.</p></div>
        <button class="btn primario" id="refazer" ${todos.some((x) => !x.resolvido) ? '' : 'disabled'}>${ic('rotate-ccw', 16)}Refazer 10 erradas</button></div>
      <div class="grade g3">${MOTIVOS.concat([{ id: 'sem', rot: 'Sem motivo marcado' }]).filter((x) => porMotivo[x.id]).map((x) => `<div class="cartao"><span class="rot">${x.rot}</span><div class="num">${porMotivo[x.id]}</div></div>`).join('') || ''}</div>
      <div class="seg secao" style="margin-bottom:12px"><button data-v="pendentes" class="${mostrar === 'pendentes' ? 'on' : ''}">Para refazer</button><button data-v="resolvidas" class="${mostrar === 'resolvidas' ? 'on' : ''}">Já acertei</button></div>
      ${lista.length ? `<div class="cartao" style="padding:4px 18px"><ul class="lista">${lista.map((x) => `
        <li><a class="cresce" href="#/questoes/q/${x.id}" style="text-decoration:none"><b style="font-weight:500">${rotuloQuestao(x.m)}</b><div class="mini">${esc(x.m.d || '')}${x.motivo ? ' · ' + MOTIVOS.find((k) => k.id === x.motivo).rot : ''}</div></a>
        <button class="btn-icone" data-rm="${x.id}" aria-label="Remover do caderno">${ic('trash-2', 16)}</button></li>`).join('')}</ul></div>`
        : vazio(mostrar === 'pendentes' ? 'Nenhum erro para refazer' : 'Nada aqui ainda', mostrar === 'pendentes' ? 'Quando você errar uma questão, ela aparece aqui.' : 'Questões que você acertar ao refazer aparecem aqui.')}`;
    el.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { mostrar = b.dataset.v; desenhar(); });
    el.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { delete S.erros[b.dataset.rm]; salvar(); desenhar(); });
    el.querySelector('#refazer').onclick = () => {
      const ids = embaralhar(todos.filter((x) => !x.resolvido)).slice(0, 10).map((x) => x.id);
      location.hash = '#/questoes/treino?modo=erros&ids=' + ids.join(',');
    };
  };
  desenhar();
}
