self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!url.pathname.endsWith('/dropzone/index.pck')) return;
  e.respondWith((async () => {
    const parts = ['index.pck.part0','index.pck.part1'];
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const part of parts) {
            const r = await fetch(part);
            if (!r.ok) throw new Error('Missing game data: ' + part);
            const reader = r.body.getReader();
            while (true) {
              const {done,value} = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          }
          controller.close();
        } catch (err) { controller.error(err); }
      }
    });
    return new Response(stream, {headers:{'Content-Type':'application/octet-stream'}});
  })());
});
