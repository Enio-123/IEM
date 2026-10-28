import { S, salvar, exportar, importar, zerar } from '../store.js';
import { gerarPlano } from '../rotina.js';
import { APP } from '../config.js';
import { ic } from '../icons.js';
import { esc, toast, confirmar, copiar } from '../ui.js';
import { aplicarTema } from '../app.js';
import { instalado, instalar } from '../instalar.js';

export function render(el) {
  const p = S.perfil;
  el.innerHTML = `
    <div class="topo-pagina"><div><h1>Ajustes</h1><p>${esc(APP.nome)} · ${esc(APP.longo)} · versão ${APP.versao}</p></div></div>
    <div class="grade g2">
      <div class="cartao grade">
        <h2>Perfil</h2>
        <label class="campo">Seu nome<input type="text" id="nome" value="${esc(p.nome)}" placeholder="Como quer ser chamada"></label>
        <label class="campo">Objetivo<input type="text" id="curso" value="${esc(p.curso)}"></label>
        <label class="campo">Data da prova de Matemática<input type="date" id="data" value="${esc(p.dataProva || '')}"></label>
        <p class="mini" style="margin-top:-8px">ENEM 2026: Matemática no 2º dia, 15 de novembro. Mude se a meta for o ENEM 2027.</p>
        <div class="grade g2"><label class="campo">Acertos hoje (de 45)<input type="number" min="0" max="45" id="aa" value="${p.acertosAtual}"></label>
        <label class="campo">Meta de acertos<input type="number" min="1" max="45" id="am" value="${p.acertosMeta}"></label></div>
      </div>
      <div class="cartao grade">
        <h2>Metas e ritmo</h2>
        <label class="campo">Cards novos por dia<input type="number" min="0" max="200" id="novos" value="${p.novosPorDia}"></label>
        <label class="campo">Meta de questões por semana<input type="number" min="0" max="2000" id="mq" value="${p.metaQuestoesSemana}"></label>
        <h2 style="margin-top:8px">Aparência</h2>
        <div class="seg">${[['claro', 'Claro'], ['escuro', 'Escuro'], ['sistema', 'Igual ao aparelho']].map(([k, r]) => `<button data-tema="${k}" class="${(p.tema || 'claro') === k ? 'on' : ''}">${r}</button>`).join('')}</div>
      </div>
    </div>
    <div class="cartao secao entre" style="flex-wrap:wrap;gap:12px">
      <div><h2>App no celular</h2><p class="sub">${instalado() ? 'O IEM já está instalado neste aparelho.' : 'Instale o IEM na tela inicial: abre como app e funciona sem internet.'}</p></div>
      ${instalado() ? '' : `<button class="btn primario" id="instalar">${ic('download', 16)}Instalar app</button>`}
    </div>
    <div class="cartao secao grade">
      <h2>Seus dados</h2>
      <p class="sub">Tudo fica salvo neste aparelho, sem conta e sem internet. Faça um backup de vez em quando e use o arquivo para passar os dados para outro aparelho.</p>
      <div class="linha-acoes" style="margin:0">
        <button class="btn" id="exp">${ic('download', 16)}Baixar backup</button>
        <button class="btn" id="copbk">${ic('copy', 16)}Copiar backup</button>
        <label class="btn">${ic('upload', 16)}Restaurar backup<input type="file" id="imp" accept="application/json" hidden></label>
        <button class="btn" id="offline">${ic('download', 16)}Baixar questões para usar offline</button>
        <span style="flex:1"></span>
        <button class="btn" id="zerar">${ic('trash-2', 16)}Apagar tudo</button>
      </div>
      <p class="mini" id="offinfo"></p>
    </div>
    <div class="cartao secao">
      <h2>Fontes e créditos</h2>
      <ul class="lista sub">
        <li>Questões e gabaritos: provas oficiais de Matemática do ENEM de 2009 a 2023 (INEP), em texto pelo projeto aberto enem-api (github.com/yunger7/enem-api). Assunto de cada questão classificado à mão para o IEM.</li>
        <li>Parâmetros da TRI: microdados do ENEM publicados pelo INEP (ITENS_PROVA). Conversão para a escala do ENEM calibrada pelo projeto analise-enem de Henrique Lindemann (github.com/HenriqueLindemann/analise-enem), uso não comercial.</li>
        <li>Ícones: Lucide. Fórmulas: KaTeX. Leitura de PDF: PDF.js.</li>
      </ul>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const campo = (sel, k, conv = (v) => v) => { $(sel).onchange = (e) => { p[k] = conv(e.target.value); salvar(); toast('Salvo'); }; };
  campo('#nome', 'nome', (v) => v.trim());
  campo('#curso', 'curso', (v) => v.trim() || p.curso);
  campo('#data', 'dataProva', (v) => v || null);
  campo('#aa', 'acertosAtual', (v) => Math.max(0, Math.min(45, +v || 0)));
  campo('#am', 'acertosMeta', (v) => Math.max(1, Math.min(45, +v || 45)));
  campo('#novos', 'novosPorDia', (v) => Math.max(0, +v || 0));
  campo('#mq', 'metaQuestoesSemana', (v) => Math.max(0, +v || 0));
  el.querySelectorAll('[data-tema]').forEach((b) => b.onclick = () => { p.tema = b.dataset.tema; salvar(); aplicarTema(); render(el); });
  if ($('#instalar')) $('#instalar').onclick = instalar;
  $('#exp').onclick = exportar;
  $('#copbk').onclick = async () => toast((await copiar(JSON.stringify(S))) ? 'Backup copiado. Cole em um arquivo .json ou nas suas notas.' : 'Não consegui copiar');
  $('#imp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!(await confirmar('Restaurar este backup? Os dados atuais deste aparelho serão substituídos.', 'Restaurar'))) return;
    try { await importar(f); aplicarTema(); toast('Backup restaurado'); render(el); } catch (err) { toast(err.message); }
  };
  $('#zerar').onclick = async () => {
    if (!(await confirmar('Apagar todo o progresso deste aparelho? Isso não pode ser desfeito. Baixe um backup antes, se quiser.', 'Apagar tudo'))) return;
    zerar(); gerarPlano(); aplicarTema(); toast('Dados apagados'); render(el);
  };
  $('#offline').onclick = async () => {
    const info = $('#offinfo');
    let ok = 0;
    for (let y = 2009; y <= 2023; y++) {
      info.textContent = `Baixando ENEM ${y}…`;
      try { const r = await fetch(`data/${y}.json`); if (r.ok) { await r.blob(); ok++; } } catch {}
    }
    info.textContent = ok === 15 ? 'Pronto: as 670 questões ficaram guardadas neste aparelho.' : `${ok} de 15 provas baixadas. Tente de novo com internet.`;
  };
}
