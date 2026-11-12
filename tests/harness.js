import plugin from '/main.js';

const query = new URLSearchParams(location.search);
if (query.has('dark')) document.body.classList.add('dark');
const host = window.host = {
  notices: [], inserted: [], copied: [], writes: [],
  failInsert: false, failCopy: false, failRead: query.has('failRead'), failWrite: false,
  readDelay: Number(query.get('readDelay') || 0), writeDelay: 0, insertDelay: 0,
  panelDisposed: 0, commandDisposed: 0,
};
let panel, command, unmount;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const context = {
  storage: {
    async get(key) {
      if (host.readDelay) await pause(host.readDelay);
      if (host.failRead) throw new Error('Read unavailable');
      return JSON.parse(localStorage.getItem(key) || 'null');
    },
    async set(key, value) {
      if (host.writeDelay) await pause(host.writeDelay);
      if (host.failWrite) throw new Error('Write unavailable');
      host.writes.push(structuredClone(value));
      localStorage.setItem(key, JSON.stringify(value));
    },
  },
  editor: { async insertAtCursor(text) {
    if (host.insertDelay) await pause(host.insertDelay);
    if (host.failInsert) throw new Error('No text editor');
    host.inserted.push(text);
  } },
  ui: {
    showNotice(text) { host.notices.push(text); },
    panels: {
      register(value) { panel = value; return () => { host.panelDisposed++; }; },
      async open(id) {
        if (id !== panel.id) throw new Error('Unexpected panel ID');
        unmount?.();
        unmount = panel.mount(document.getElementById('container'), {
          shell: { set({ header }) {
            document.getElementById('title').textContent = header.title;
            document.getElementById('description').textContent = header.description;
          } },
        });
      },
    },
  },
  commands: { register(value) { command = value; return () => { host.commandDisposed++; }; } },
};
// Clipboard mock deliberately returns the same async success/failure shape as the browser API.
if (!query.has('realClipboard')) Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { async writeText(text) {
    if (host.failCopy) throw new Error('Clipboard denied');
    host.copied.push(text);
  } },
});
const dispose = plugin.activate(context);
host.close = () => { unmount?.(); unmount = undefined; };
host.reopen = () => command.run();
host.deactivate = () => { host.close(); dispose(); };
await command.run();
