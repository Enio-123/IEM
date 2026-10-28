// Funciona offline: guarda a casca do app e as provas já abertas.
const VERSAO = 'iem-v3';
const CASCA = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/config.js', 'js/store.js', 'js/content.js', 'js/srs.js', 'js/tri.js', 'js/qbank.js', 'js/ui.js', 'js/icons.js', 'js/foco.js', 'js/rotina.js', 'js/meta45.js', 'js/instalar.js',
  'js/views/hoje.js', 'js/views/cards.js', 'js/views/questoes.js', 'js/views/simulado.js', 'js/views/plano.js', 'js/views/progresso.js', 'js/views/focoView.js', 'js/views/mapas.js', 'js/views/escada.js', 'js/views/metodos.js', 'js/views/ajustes.js', 'js/views/mais.js',
  'vendor/marked.js', 'vendor/purify.js', 'vendor/katex/katex.min.js', 'vendor/katex/katex.min.css', 'data/index.json', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
const PROVAS = Array.from({ length: 15 }, (_, i) => `data/${2009 + i}.json`);
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting())); });
// Depois de ativar, guarda as 15 provas em segundo plano para o app funcionar todo offline.
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()).then(() => caches.open(VERSAO).then((c) => Promise.all(PROVAS.map((u) => c.match(u).then((r) => r || c.add(u).catch(() => {})))))));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Provas: cache primeiro (não mudam). Resto: rede primeiro, cache se offline.
  if (/\/data\/\d{4}\.json$/.test(u.pathname) || u.pathname.includes('/vendor/')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => { const c = resp.clone(); caches.open(VERSAO).then((k) => k.put(e.request, c)); return resp; })));
  } else {
    e.respondWith(fetch(e.request).then((resp) => { const c = resp.clone(); caches.open(VERSAO).then((k) => k.put(e.request, c)); return resp; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
  }
});
