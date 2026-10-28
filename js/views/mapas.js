import { S, salvar, uid } from '../store.js';
import { ic } from '../icons.js';
import { esc, confirmar, vazio } from '../ui.js';

export function render(el, partes) {
  if (partes[0]) return editor(el, partes[0]);
  const lista = S.mapas.slice().sort((a, b) => b.em - a.em);
  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Mapas mentais</h1><p>Escreva em tópicos com recuo (Tab) e o mapa é desenhado na hora.</p></div>
      <button class="btn primario" id="novo">${ic('plus', 16)}Novo mapa</button></div>
    ${lista.length ? `<div class="grade g3">${lista.map((m) => `<a class="cartao clicavel" href="#/mapas/${m.id}" style="text-decoration:none"><h3>${esc(m.titulo)}</h3><p class="mini" style="margin-top:6px">${m.texto.split('\n').filter((l) => l.trim()).length} tópicos · ${new Date(m.em).toLocaleDateString('pt-BR')}</p></a>`).join('')}</div>`
      : vazio('Nenhum mapa ainda', 'Mapas mentais ajudam a ver como os assuntos de uma matéria se conectam.')}`;
  el.querySelector('#novo').onclick = () => {
    const m = { id: uid(), titulo: 'Novo mapa', texto: 'Tema central\n\tTópico 1\n\t\tDetalhe\n\tTópico 2', em: Date.now() };
    S.mapas.push(m); salvar(); location.hash = '#/mapas/' + m.id;
  };
}

function arvore(texto) {
  const linhas = texto.split('\n').filter((l) => l.trim());
  if (!linhas.length) return null;
  const nivel = (l) => { const m = l.match(/^[\t ]*/)[0]; return m.replace(/ {2}/g, '\t').replace(/ /g, '').length; };
  const raiz = { t: linhas[0].trim().replace(/^[-*•]\s*/, ''), f: [], n: 0 };
  const pilha = [raiz];
  for (const l of linhas.slice(1)) {
    const n = Math.max(1, nivel(l));
    const no = { t: l.trim().replace(/^[-*•]\s*/, ''), f: [], n };
    while (pilha.length > 1 && pilha[pilha.length - 1].n >= n) pilha.pop();
    pilha[pilha.length - 1].f.push(no); pilha.push(no);
  }
  return raiz;
}

function svgMapa(raiz) {
  const ALT = 34, LARG = 190, FOLGA = 40;
  let y = 0;
  const pos = (no, prof) => {
    no.x = prof * (LARG + FOLGA);
    if (!no.f.length) { no.y = y; y += ALT + 8; }
    else { no.f.forEach((f) => pos(f, prof + 1)); no.y = (no.f[0].y + no.f[no.f.length - 1].y) / 2; }
  };
  pos(raiz, 0);
  let prof = 0; const medir = (n, p) => { prof = Math.max(prof, p); n.f.forEach((f) => medir(f, p + 1)); }; medir(raiz, 0);
  const W = (prof + 1) * (LARG + FOLGA), H = Math.max(y, ALT + 8);
  let s = '';
  const desenhar = (no) => {
    for (const f of no.f) {
      const x1 = no.x + LARG, y1 = no.y + ALT / 2, x2 = f.x, y2 = f.y + ALT / 2, mx = (x1 + x2) / 2;
      s += `<path d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}"/>`;
      desenhar(f);
    }
    const txt = no.t.length > 26 ? no.t.slice(0, 25) + '…' : no.t;
    const r = no === raiz;
    s += `<g><title>${esc(no.t)}</title><rect x="${no.x}" y="${no.y}" width="${LARG}" height="${ALT}" rx="8" class="${r ? 'raiz' : ''}"/><text x="${no.x + 12}" y="${no.y + ALT / 2 + 4}" class="${r ? 'raiz' : ''}">${esc(txt)}</text></g>`;
  };
  desenhar(raiz);
  return `<svg viewBox="0 -2 ${W} ${H + 4}" style="width:100%;height:auto;max-width:${W}px;display:block" role="img" aria-label="Mapa mental">${s}</svg>`;
}

function editor(el, id) {
  const m = S.mapas.find((x) => x.id === id);
  if (!m) { el.innerHTML = vazio('Mapa não encontrado', ''); return; }
  el.innerHTML = `
    <a href="#/mapas" class="btn fantasma peq" style="margin-bottom:10px">${ic('chevron-left', 16)}Mapas</a>
    <div class="entre" style="margin-bottom:14px;gap:8px"><input type="text" id="tit" value="${esc(m.titulo)}" aria-label="Título" style="font-size:20px;font-weight:600;border:0;padding:4px 0;background:none"><button class="btn" id="apagar">${ic('trash-2', 16)}Apagar</button></div>
    <div class="grade g2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)">
      <div><textarea id="txt" rows="18" style="font-family:ui-monospace,monospace;font-size:14px;tab-size:2" aria-label="Tópicos">${esc(m.texto)}</textarea>
      <p class="mini" style="margin-top:6px">A primeira linha é o tema central. Use Tab para criar subtópicos e Shift+Tab para voltar.</p></div>
      <div class="mapa-svg" id="svg"></div>
    </div>`;
  const txt = el.querySelector('#txt');
  const atualizar = () => { const r = arvore(txt.value); el.querySelector('#svg').innerHTML = r ? svgMapa(r) : '<p class="sub" style="padding:16px">Escreva o tema central.</p>'; };
  let t;
  txt.oninput = () => { m.texto = txt.value; m.em = Date.now(); atualizar(); clearTimeout(t); t = setTimeout(salvar, 400); };
  txt.onkeydown = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ini = txt.value.lastIndexOf('\n', txt.selectionStart - 1) + 1;
    const pos = txt.selectionStart;
    if (e.shiftKey) { if (txt.value[ini] === '\t') { txt.value = txt.value.slice(0, ini) + txt.value.slice(ini + 1); txt.selectionStart = txt.selectionEnd = Math.max(ini, pos - 1); } }
    else { txt.value = txt.value.slice(0, ini) + '\t' + txt.value.slice(ini); txt.selectionStart = txt.selectionEnd = pos + 1; }
    txt.oninput();
  };
  el.querySelector('#tit').oninput = (e) => { m.titulo = e.target.value || 'Sem título'; salvar(); };
  el.querySelector('#apagar').onclick = async () => { if (await confirmar('Apagar este mapa?', 'Apagar')) { S.mapas = S.mapas.filter((x) => x !== m); salvar(); location.hash = '#/mapas'; } };
  atualizar();
}
