// Instalação como app (PWA): botão nativo no Android/Chrome e instruções no iPhone.
import { janela } from './ui.js';
import { ic } from './icons.js';

let pedido = null;
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f());

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedido = e; avisar(); });
window.addEventListener('appinstalled', () => { pedido = null; avisar(); });

export const aoMudarInstalacao = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
// Só conta como instalado quando abriu pelo ícone: no navegador normal, fora de iframe e de app de terceiros.
const dentroDeApp = () => window.top !== window.self || /(FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)|Claude)/i.test(navigator.userAgent);
export const instalado = () => !dentroDeApp() && (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function instalar() {
  if (pedido) {
    pedido.prompt();
    const { outcome } = await pedido.userChoice.catch(() => ({}));
    if (outcome === 'accepted') pedido = null;
    avisar();
    return;
  }
  const aviso = dentroDeApp() ? '<p class="aviso">Você está vendo o IEM dentro de outro app. Copie o link enio-123.github.io/IEM e abra direto no navegador do celular para instalar.</p>' : '';
  const passos = ehIOS()
    ? ['Abra este site no Safari.', `Toque em Compartilhar ${ic('upload', 16)} na barra de baixo.`, 'Escolha "Adicionar à Tela de Início" e toque em Adicionar.']
    : ['Abra este site no Chrome.', 'Toque no menu (três pontinhos) no canto de cima.', 'Escolha "Instalar app" ou "Adicionar à tela inicial".'];
  janela('Instalar o IEM', `
    <p class="sub">O IEM vira um app na tela inicial, abre em tela cheia e funciona sem internet depois da primeira vez.</p>${aviso}
    <ol class="lista">${passos.map((p, i) => `<li><b>${i + 1}.</b> <span>${p}</span></li>`).join('')}</ol>`);
}
