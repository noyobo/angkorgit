import { file } from 'bun';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '../../apps/desktop/dist');

Bun.serve({
  port: 1420,
  fetch(req) {
    const { pathname } = new URL(req.url);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const asset = file(join(dist, relative));
    if (asset.size > 0) return new Response(asset);
    return new Response(file(join(dist, 'index.html')));
  },
});

console.log('e2e static server on http://localhost:1420');
