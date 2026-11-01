// インストール条件を満たすための最小の service worker。キャッシュはしない（デプロイ後に古くならないよう常にネットワークへ素通し）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
	const u = new URL(e.request.url);
	if (u.origin !== location.origin) return;   // YouTube などの外部は触らない
	e.respondWith(fetch(e.request));
});
