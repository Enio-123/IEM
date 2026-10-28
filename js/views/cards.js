import { S, salvar, uid, novoCard, registrarDia, diaAtual } from '../store.js';
import { fila, proximo, rotuloIntervalo, NOTAS } from '../srs.js';
import { AREAS, MATERIAS, nomeMateria } from '../content.js';
import { ic } from '../icons.js';
import { esc, md, janela, toast, confirmar, vazio } from '../ui.js';

export const nomeDeck = (d) => d.nome || nomeMateria(d.area, d.materia);
const AREA_ROT = { MT: 'Matemática', OUTRA: 'Outros' };

export function render(el, partes, params) {
  if (partes[0] === 'estudar') return estudar(el, params.deck ? params.deck.split(',') : null);
  if (partes[0] === 'deck') return verDeck(el, partes[1]);
  if (partes[0] === 'gerar') return gerar(el, params.deck);
  return listaDecks(el);
}

function contagem(deckId) {
  const f = fila(S.cards, { decks: [deckId], limiteNovos: Infinity });
  const total = Object.values(S.cards).filter((c) => c.deck === deckId).length;
  return { venc: f.aprendendo.length + f.revisoes.length, novos: f.novos.length, total };
}

function listaDecks(el) {
  const d = diaAtual();
  const geral = fila(S.cards, { limiteNovos: S.perfil.novosPorDia, novosHoje: d.novos || 0 });
  const porArea = {};
  Object.values(S.decks).forEach((dk) => { (porArea[dk.area] = porArea[dk.area] || []).push(dk); });
  const ordem = ['MT', 'OUTRA'];
  el.innerHTML = `
    <div class="topo-pagina">
      <div><h1>Flashcards</h1><p>Repetição espaçada: cada card volta no momento certo para não ser esquecido.</p></div>
      <div class="linha-acoes" style="margin:0"><button class="btn" id="novo-deck">${ic('plus', 16)}Novo baralho</button><a class="btn" href="#/cards/gerar">${ic('file-text', 16)}Gerar de texto ou PDF</a></div>
    </div>
    <div class="cartao entre" style="flex-wrap:wrap">
      <div><span class="rot">Para hoje</span><div class="num" style="margin-top:4px">${geral.total} <small>cards</small></div>
      <p class="mini">${geral.aprendendo.length + geral.revisoes.length} revisões · ${geral.novos.length} novos</p></div>
      <a class="btn primario grande ${geral.total ? '' : 'disabled'}" href="#/cards/estudar" ${geral.total ? '' : 'aria-disabled="true"'}>${ic('play', 18)}Estudar tudo</a>
    </div>
    ${ordem.filter((a) => porArea[a]).map((a) => `
      <section class="secao"><h2>${AREA_ROT[a] || a}</h2>
        <div class="cartao" style="padding:4px 18px"><ul class="lista">
          ${porArea[a].sort((x, y) => nomeDeck(x).localeCompare(nomeDeck(y))).map((dk) => { const c = contagem(dk.id); return `
            <li><a href="#/cards/deck/${dk.id}" class="cresce" style="text-decoration:none"><b style="font-weight:500">${esc(nomeDeck(dk))}</b><div class="mini">${c.total} cards</div></a>
              <span class="sub" title="Revisões vencidas e novos">${c.venc} · ${c.novos}</span>
              <a class="btn peq" href="#/cards/estudar?deck=${dk.id}" ${c.venc + c.novos ? '' : 'aria-disabled="true" style="opacity:.4;pointer-events:none"'}>Estudar</a></li>`; }).join('')}
        </ul></div></section>`).join('')}`;
  el.querySelector('#novo-deck').onclick = () => editarDeck(null, () => listaDecks(el));
}

function opcoesMateria(area, sel) {
  const ops = MATERIAS[area] ? Object.entries(MATERIAS[area]) : [];
  return `<option value="">Geral</option>` + ops.map(([k, v]) => `<option value="${esc(k)}" ${k === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
}

export function editarDeck(dk, depois) {
  const novo = !dk;
  dk = dk || { id: 'd_' + uid(), nome: '', area: 'MT', materia: '' };
  const { el, fechar } = janela(novo ? 'Novo baralho' : 'Editar baralho', `
    <label class="campo">Nome<input type="text" id="dn" value="${esc(dk.nome || '')}" placeholder="${novo ? 'Ex.: Logaritmos' : esc(nomeDeck(dk))}"></label>
    <div class="grade g2"><label class="campo">Área<select id="da">${Object.entries(AREA_ROT).map(([k, v]) => `<option value="${k}" ${k === dk.area ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label class="campo">Matéria<select id="dm">${opcoesMateria(dk.area, dk.materia)}</select></label></div>
    <div class="linha-acoes">${!novo ? '<button class="btn" data-apagar>Apagar baralho</button>' : ''}<span style="flex:1"></span><button class="btn primario" data-ok>Salvar</button></div>`);
  el.querySelector('#da').onchange = (e) => { el.querySelector('#dm').innerHTML = opcoesMateria(e.target.value, ''); };
  el.querySelector('[data-ok]').onclick = () => {
    const nome = el.querySelector('#dn').value.trim();
    const area = el.querySelector('#da').value, materia = el.querySelector('#dm').value || null;
    if (!nome && !materia) { toast('Dê um nome ou escolha uma matéria'); return; }
    S.decks[dk.id] = { ...dk, nome: nome || null, area, materia, criado: dk.criado || Date.now() };
    salvar(); fechar(); depois && depois(dk.id);
  };
  const ap = el.querySelector('[data-apagar]');
  if (ap) ap.onclick = async () => {
    const n = Object.values(S.cards).filter((c) => c.deck === dk.id).length;
    if (!(await confirmar(`Apagar o baralho e seus ${n} cards?`, 'Apagar'))) return;
    for (const c of Object.values(S.cards)) if (c.deck === dk.id) delete S.cards[c.id];
    delete S.decks[dk.id]; salvar(); fechar(); location.hash = '#/cards';
  };
}

function verDeck(el, id) {
  const dk = S.decks[id];
  if (!dk) { location.hash = '#/cards'; return; }
  const desenhar = () => {
    const cards = Object.values(S.cards).filter((c) => c.deck === id).sort((a, b) => b.criado - a.criado);
    const c = contagem(id);
    el.innerHTML = `
      <a href="#/cards" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Baralhos</a>
      <div class="topo-pagina">
        <div><h1>${esc(nomeDeck(dk))}</h1><p>${c.total} cards · ${c.venc} para revisar · ${c.novos} novos</p></div>
        <div class="linha-acoes" style="margin:0">
          <button class="btn" id="edt">${ic('pencil', 16)}Editar</button>
          <a class="btn" href="#/cards/gerar?deck=${id}">${ic('file-text', 16)}Gerar de texto</a>
          <button class="btn" id="novo">${ic('plus', 16)}Novo card</button>
          <a class="btn primario" href="#/cards/estudar?deck=${id}">${ic('play', 16)}Estudar</a>
        </div>
      </div>
      ${cards.length ? `<div class="cartao" style="padding:4px 18px"><ul class="lista">${cards.map((k) => `
        <li><div class="cresce"><div>${md(k.frente, { tex: true, inline: true })}</div><div class="mini">${k.estado === 'novo' ? 'Novo' : k.estado === 'revisao' ? `Revisão em ${new Date(k.venc).toLocaleDateString('pt-BR')}` : 'Aprendendo'}${k.lapsos ? ` · errou ${k.lapsos}x` : ''}${k.origem ? ' · ' + esc(k.origem) : ''}</div></div>
        <button class="btn-icone" data-ed="${k.id}" aria-label="Editar card">${ic('pencil', 16)}</button></li>`).join('')}</ul></div>`
      : vazio('Baralho vazio', 'Crie cards à mão, a partir de um texto ou direto de uma questão que você errou.')}`;
    el.querySelector('#novo').onclick = () => editarCard(null, id, desenhar);
    el.querySelector('#edt').onclick = () => editarDeck(dk, desenhar);
    el.querySelectorAll('[data-ed]').forEach((b) => b.onclick = () => editarCard(S.cards[b.dataset.ed], id, desenhar));
  };
  desenhar();
}

function reduzirImagem(arquivo, max = 900) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / img.width);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/webp', 0.8));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(arquivo);
  });
}

export function editarCard(card, deckId, depois, preset = {}) {
  const novo = !card;
  let img = card ? card.img : preset.img || null;
  const decks = Object.values(S.decks).sort((a, b) => nomeDeck(a).localeCompare(nomeDeck(b)));
  const { el, fechar } = janela(novo ? 'Novo card' : 'Editar card', `
    <label class="campo">Baralho<select id="cd">${decks.map((d) => `<option value="${d.id}" ${d.id === (card ? card.deck : deckId) ? 'selected' : ''}>${esc(nomeDeck(d))}</option>`).join('')}</select></label>
    <label class="campo">Frente (pergunta)<textarea id="cf" rows="3">${esc(card ? card.frente : preset.frente || '')}</textarea></label>
    <label class="campo">Verso (resposta)<textarea id="cv" rows="4">${esc(card ? card.verso : preset.verso || '')}</textarea></label>
    <p class="mini">Fórmulas entre cifrões: $x^2 + y^2$ · Negrito com **texto**</p>
    <div id="cprev" class="cartao" style="font-size:15px"></div>
    <div class="entre"><label class="btn peq">${ic('image', 16)}Imagem<input type="file" accept="image/*" id="ci" hidden></label><span id="cinfo" class="mini">${img ? 'Imagem anexada' : ''}</span>${img ? '<button class="btn fantasma peq" id="crm">Remover imagem</button>' : ''}</div>
    <div class="linha-acoes">${!novo ? '<button class="btn" data-apagar>Apagar</button>' : ''}<span style="flex:1"></span><button class="btn primario" data-ok>Salvar</button></div>`);
  const prev = () => { el.querySelector('#cprev').innerHTML = `<div>${md(el.querySelector('#cf').value || 'Frente', { tex: true })}</div><hr style="border:0;border-top:1px solid var(--linha);margin:10px 0">${img ? `<img src="${img}" style="max-width:100%;border-radius:6px">` : ''}<div>${md(el.querySelector('#cv').value || 'Verso', { tex: true })}</div>`; };
  el.querySelector('#cf').oninput = prev; el.querySelector('#cv').oninput = prev; prev();
  el.querySelector('#ci').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; img = await reduzirImagem(f); el.querySelector('#cinfo').textContent = 'Imagem anexada'; prev(); };
  const rm = el.querySelector('#crm'); if (rm) rm.onclick = () => { img = null; rm.remove(); el.querySelector('#cinfo').textContent = ''; prev(); };
  el.querySelector('[data-ok]').onclick = () => {
    const frente = el.querySelector('#cf').value.trim(), verso = el.querySelector('#cv').value.trim(), deck = el.querySelector('#cd').value;
    if (!frente || !verso) { toast('Preencha frente e verso'); return; }
    if (card) Object.assign(card, { frente, verso, deck, img });
    else { const id = uid(); S.cards[id] = novoCard(id, deck, frente, verso, { img, origem: preset.origem || null, qid: preset.qid || null }); }
    salvar(); fechar(); toast(novo ? 'Card criado' : 'Card salvo'); depois && depois();
  };
  const ap = el.querySelector('[data-apagar]');
  if (ap) ap.onclick = () => { delete S.cards[card.id]; salvar(); fechar(); depois && depois(); };
}

function estudar(el, decks) {
  const d = diaAtual();
  let atual = null, mostrando = false, feitos = 0;
  const proximoCard = () => {
    const f = fila(S.cards, { decks, limiteNovos: d.leve ? 5 : S.perfil.novosPorDia, novosHoje: d.novos || 0, limiteRevisoes: d.leve ? 30 : Infinity });
    const agora = Date.now();
    const prontos = f.aprendendo.filter((c) => c.venc <= agora);
    atual = prontos[0] || f.revisoes[0] || f.novos[0] || f.aprendendo[0] || null;
    mostrando = false;
    desenhar(f);
  };
  const desenhar = (f) => {
    if (!atual) {
      el.innerHTML = `<div class="estudo">${vazio('Tudo revisado por agora', feitos ? `Você revisou ${feitos} cards nesta sessão.` : 'Não há cards para revisar neste momento.', '<div class="linha-acoes"><a class="btn" href="#/cards">Ver baralhos</a><a class="btn primario" href="#/hoje">Voltar para hoje</a></div>')}</div>`;
      return;
    }
    const dk = S.decks[atual.deck];
    el.innerHTML = `<div class="estudo">
      <div class="progresso-estudo"><span>${f.novos.length} novos</span><span>${f.aprendendo.length} aprendendo</span><span>${f.revisoes.length} revisões</span></div>
      <div class="flash">
        <div class="mini">${esc(dk ? nomeDeck(dk) : '')}</div>
        <div class="frente">${md(atual.frente, { tex: true })}</div>
        ${mostrando ? `<div class="verso">${atual.img ? `<img src="${atual.img}" alt="">` : ''}${md(atual.verso, { tex: true })}</div>` : ''}
      </div>
      ${mostrando ? `<div class="notas-srs">${NOTAS.map((n) => `<button class="btn ${n.n === 3 ? 'primario' : ''}" data-n="${n.n}">${n.rot}<small>${rotuloIntervalo(atual, n.n)}</small></button>`).join('')}</div>`
        : `<button class="btn primario grande" id="mostrar" style="width:100%;margin-top:16px">Mostrar resposta <span class="mini esconde-celular" style="color:inherit;opacity:.7">espaço</span></button>`}
      <div class="linha-acoes" style="justify-content:center"><button class="btn fantasma peq" id="editar">${ic('pencil', 14)}Editar card</button>${atual.qid ? `<a class="btn fantasma peq" href="#/questoes/q/${atual.qid}">${ic('external-link', 14)}Ver questão</a>` : ''}</div>
    </div>`;
    const m = el.querySelector('#mostrar'); if (m) m.onclick = () => { mostrando = true; desenhar(f); };
    el.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => responder(+b.dataset.n));
    el.querySelector('#editar').onclick = () => editarCard(atual, atual.deck, () => desenhar(f));
  };
  const responder = (nota) => {
    if (atual.estado === 'novo') d.novos = (d.novos || 0) + 1;
    S.cards[atual.id] = proximo(atual, nota);
    feitos++;
    registrarDia('cards');
    salvar();
    proximoCard();
  };
  const tecla = (e) => {
    if (e.target.closest('input, textarea, select') || document.querySelector('.modal-fundo')) return;
    if (!atual) return;
    if (!mostrando && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); mostrando = true; el.querySelector('#mostrar')?.click(); }
    else if (mostrando && ['1', '2', '3', '4'].includes(e.key)) responder(+e.key);
  };
  document.addEventListener('keydown', tecla);
  proximoCard();
  return () => document.removeEventListener('keydown', tecla);
}

// Gerar cards a partir de texto colado ou PDF: ela escolhe as frases e clica nas palavras para esconder (lacuna).
function gerar(el, deckInicial) {
  let frases = [];
  const decks = Object.values(S.decks).sort((a, b) => nomeDeck(a).localeCompare(nomeDeck(b)));
  el.innerHTML = `
    <a href="#/cards" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Baralhos</a>
    <div class="topo-pagina"><div><h1>Gerar cards de um texto</h1><p>Cole um resumo ou envie um PDF. Linhas no formato "termo: definição" viram pergunta e resposta. Nas outras frases, clique nas palavras que quer esconder.</p></div></div>
    <div class="cartao grade">
      <textarea id="txt" rows="8" placeholder="Cole aqui o seu resumo da aula…"></textarea>
      <div class="entre" style="flex-wrap:wrap">
        <label class="btn">${ic('upload', 16)}Enviar PDF<input type="file" id="pdf" accept="application/pdf" hidden></label>
        <span id="pdfinfo" class="mini"></span>
        <span style="flex:1"></span>
        <button class="btn primario" id="separar">Separar frases</button>
      </div>
    </div>
    <div id="frases" class="secao"></div>`;
  el.querySelector('#pdf').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const info = el.querySelector('#pdfinfo'); info.textContent = 'Lendo PDF…';
    try {
      const pdfjs = await import('../../vendor/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      let txt = '';
      const max = Math.min(doc.numPages, 40);
      for (let p = 1; p <= max; p++) {
        const pg = await doc.getPage(p);
        const c = await pg.getTextContent();
        let linha = '';
        for (const it of c.items) { linha += it.str + (it.hasEOL ? '\n' : ''); }
        txt += linha + '\n';
      }
      el.querySelector('#txt').value = txt.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      info.textContent = `${max} de ${doc.numPages} páginas lidas` + (doc.numPages > 40 ? ' (limite de 40)' : '');
      if (!txt.trim()) info.textContent = 'O PDF parece ser imagem escaneada, sem texto para extrair.';
    } catch (err) { console.error(err); info.textContent = 'Não consegui ler esse PDF.'; }
  };
  el.querySelector('#separar').onclick = () => {
    const txt = el.querySelector('#txt').value.trim();
    if (!txt) { toast('Cole um texto primeiro'); return; }
    frases = [];
    for (const bruto of txt.split(/\n+/)) {
      const linha = bruto.trim(); if (linha.length < 12) continue;
      const def = linha.match(/^(.{2,80}?)\s*[:—–]\s+(.{6,})$/);
      if (def) { frases.push({ tipo: 'def', frente: def[1].replace(/^[-•*\d.)\s]+/, ''), verso: def[2], usar: true }); continue; }
      for (const f of linha.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)) if (f.trim().length >= 25) frases.push({ tipo: 'lac', txt: f.trim(), ocultas: new Set(), usar: false });
    }
    desenharFrases();
  };
  const desenharFrases = () => {
    const box = el.querySelector('#frases');
    if (!frases.length) { box.innerHTML = vazio('Nenhuma frase encontrada', 'Tente um texto com frases completas ou linhas "termo: definição".'); return; }
    const n = frases.filter((f) => f.usar && (f.tipo === 'def' || f.ocultas.size)).length;
    box.innerHTML = `
      <div class="entre" style="margin-bottom:12px;flex-wrap:wrap;gap:8px"><h2>${frases.length} trechos</h2>
        <div class="linha-acoes" style="margin:0"><select id="gd" aria-label="Baralho">${decks.map((d) => `<option value="${d.id}" ${d.id === deckInicial ? 'selected' : ''}>${esc(nomeDeck(d))}</option>`).join('')}</select>
        <button class="btn primario" id="criar" ${n ? '' : 'disabled'}>Criar ${n} card${n === 1 ? '' : 's'}</button></div></div>
      <div class="grade">${frases.map((f, i) => f.tipo === 'def' ? `
        <div class="frase-gerar"><label class="check"><input type="checkbox" data-usar="${i}" ${f.usar ? 'checked' : ''}><div><b>${esc(f.frente)}</b><div class="sub">${esc(f.verso)}</div></div></label></div>` : `
        <div class="frase-gerar"><div class="palavras">${f.txt.split(/(\s+)/).map((w, j) => /\s/.test(w) ? w : `<span class="palavra ${f.ocultas.has(j) ? 'oculta' : ''}" data-f="${i}" data-w="${j}">${esc(w)}</span>`).join('')}</div>
        <p class="mini" style="margin-top:6px">${f.ocultas.size ? `${f.ocultas.size} palavra(s) escondida(s)` : 'Clique nas palavras-chave para criar a lacuna'}</p></div>`).join('')}</div>`;
    box.querySelectorAll('[data-usar]').forEach((c) => c.onchange = () => { frases[+c.dataset.usar].usar = c.checked; desenharFrases(); });
    box.querySelectorAll('.palavra').forEach((s) => s.onclick = () => {
      const f = frases[+s.dataset.f], j = +s.dataset.w;
      f.ocultas.has(j) ? f.ocultas.delete(j) : f.ocultas.add(j);
      f.usar = f.ocultas.size > 0; desenharFrases();
    });
    const cr = box.querySelector('#criar');
    if (cr) cr.onclick = () => {
      const deck = box.querySelector('#gd').value; let k = 0;
      for (const f of frases) {
        if (!f.usar) continue;
        let frente, verso;
        if (f.tipo === 'def') { frente = f.frente; verso = f.verso; }
        else {
          if (!f.ocultas.size) continue;
          const partes = f.txt.split(/(\s+)/);
          frente = partes.map((w, j) => (f.ocultas.has(j) ? '_____' : w)).join('');
          verso = partes.map((w, j) => (f.ocultas.has(j) ? `**${w}**` : w)).join('');
        }
        const id = uid(); S.cards[id] = novoCard(id, deck, frente, verso, { origem: 'Gerado de texto' }); k++;
      }
      salvar(); toast(`${k} cards criados`); location.hash = '#/cards/deck/' + deck;
    };
  };
}
