// EdgeEver 颜文字 1.1.0 — self-contained, no network requests.
const CATEGORIES = [
  { id: "happy", name: "开心", tags: "快乐 高兴 加油 happy smile", items: ["(＾▽＾)", "(⌒▽⌒)", "(*^▽^*)", "(≧▽≦)", "(●'◡'●)", "(◠‿◠)", "(๑•̀ㅂ•́)و✧", "(ノ≧∇≦)ノ", "^_^", "(^人^)"] },
  { id: "cute", name: "卖萌", tags: "可爱 抱抱 cute hug", items: ["(｡•̀ᴗ-)✧", "(◕ᴗ◕✿)", "(≧◡≦)", "(つ≧▽≦)つ", "(๑•́ ₃ •̀๑)", "(´｡• ω •｡`)", "(￣ω￣)", "(˶ᵔ ᵕ ᵔ˶)", "(=^･ω･^=)", "(・ω・)ノ"] },
  { id: "sad", name: "难过", tags: "伤心 哭哭 委屈 sad cry", items: ["(｡•́︿•̀｡)", "(T_T)", "(T⌓T)", "(╥_╥)", "(´;ω;｀)", "(ಥ_ಥ)", "(个_个)", "( ；∀；)", "(╯︵╰,)"] },
  { id: "surprise", name: "惊讶", tags: "震惊 吃惊 surprise wow", items: ["(⊙_⊙)", "(⊙﹏⊙)", "(O_O)", "Σ(°△°|||)", "(◎_◎;)", "(⊙_◎)", "(•̀ᴗ•́)و", "(ﾟДﾟ)", "(⊙.☉)"] },
  { id: "angry", name: "生气", tags: "愤怒 无语 angry", items: ["(｀へ´)", "(¬_¬\")", "(≖_≖)", "(눈_눈)", "(｀⌒´メ)", "(╬ Ò﹏Ó)", "(￢_￢)", "(≧皿≦)"] },
  { id: "love", name: "爱心", tags: "喜欢 心动 亲亲 love heart", items: ["(´∀｀)♡", "(♡˙︶˙♡)", "(っ˘з(˘⌣˘ )♡", "(灬º‿º灬)♡", "(｡♡‿♡｡)", "(♥ω♥ )", "(づ｡◕‿‿◕｡)づ"] },
  { id: "shrug", name: "无奈", tags: "摊手 尴尬 shrug", items: ["¯\\_(ツ)_/¯", "(￣▽￣)~*", "(；一_一)", "(・_・;)", "(￣ヘ￣)", "(・へ・)", "┐(´д｀)┌", "(´-ω-`)"] },
  { id: "sleepy", name: "累困", tags: "困倦 睡觉 晚安 疲惫 sleepy tired", items: ["(－ω－) zzZ", "(∪｡∪)｡｡｡zzZ", "(＿ ＿*) Z z z", "(￣o￣) . z Z", "(－_－) zzZ", "(。-ω-)zzz"] },
  { id: "animals", name: "动物", tags: "小熊 猫咪 小狗 兔子 animal cat bear dog rabbit", items: ["ʕ•ᴥ•ʔ", "(ᵔᴥᵔ)", "ʕ•́ᴥ•̀ʔっ", "(=^･ｪ･^=)", "(^･ｪ･^)", "U･ｪ･U", "(='ｘ'=)"] },
  { id: "emoji", name: "emoji", kind: "emoji", tags: "表情 emoji", items: [
    ["✨", "闪光 sparkle"], ["🌟", "星光 star"], ["💫", "流星 dizzy"], ["⭐", "星星 star"],
    ["🌈", "彩虹 rainbow"], ["🌸", "樱花 flower"], ["🌿", "绿叶 herb"], ["🍀", "幸运 clover"],
    ["🌻", "向日葵 sunflower"], ["🍃", "落叶 leaf"], ["🔥", "火焰 fire"], ["💡", "灵感 idea"],
    ["🎯", "目标 target"], ["✅", "完成 done"], ["☑️", "勾选 check"], ["⚠️", "警告 warning"],
    ["❗", "重要 感叹号"], ["❓", "问题 question"], ["📌", "标记 pin"], ["📝", "笔记 note"],
    ["🏷️", "标签 tag"], ["🔖", "书签 bookmark"], ["💚", "绿心 爱心 heart"], ["❤️", "红心 爱心 love heart"],
    ["💙", "蓝心 爱心 heart"], ["💛", "黄心 爱心 heart"], ["🧡", "橙心 爱心 heart"], ["💜", "紫心 爱心 heart"],
    ["🤍", "白心 爱心 heart"], ["🎉", "庆祝 party"], ["🎊", "庆祝 彩带 confetti"],
    ["🎂", "生日 蛋糕 birthday cake"], ["🥳", "派对 庆祝 party"],
  ] },
  { id: "divider", name: "分割线", kind: "divider", tags: "装饰 分隔线 divider line", items: ["───────────", "─── ✦ ───", "· · ─────── · ·", "═══════════", "── ⋆⋅☆⋅⋆ ──", "﹏﹏﹏﹏﹏﹏﹏", "✧ ──────── ✧"] },
];
const normalize = (text) => text.normalize("NFKC").toLowerCase();
const ITEMS = CATEGORIES.flatMap((category) => category.items.map((value, index) => {
  const [text, tags = ""] = Array.isArray(value) ? value : [value];
  return { key: `${category.id}-${index}`, text, category: category.id, kind: category.kind || "",
    label: category.kind === "emoji" ? tags.split(" ")[0] : category.name,
    search: normalize(`${text} ${category.name} ${category.tags} ${tags}`) };
}));
const BY_TEXT = new Map(ITEMS.map((item) => [item.text, item]));
const STORAGE_KEY = "kaomoji.preferences.v1";
const RECENT_LIMIT = 24;
// Inline styles also support manifest-only installations.
const STYLE = `
.km-root { --km-accent: #3f7d5c; color: inherit; font: inherit; display: flex; flex-direction: column; gap: 12px; height: min(600px, 68dvh); min-height: 220px; min-width: 0; padding: 2px; }
.km-root *, .km-root *::before, .km-root *::after { box-sizing: border-box; }
.km-root button, .km-root input { font: inherit; color: inherit; }
.km-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 0 0 auto; }
.km-search-wrap { flex: 1 1 180px; display: flex; align-items: center; border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 10px; min-width: 0; }
.km-search { width: 100%; min-width: 0; border: 0; background: transparent; padding: 10px 12px; outline: none; font-size: 13px !important; }
.km-search-wrap:focus-within { outline: 2px solid var(--km-accent); outline-offset: 2px; }
.km-clear { border: 0; background: transparent; padding: 6px 10px; cursor: pointer; border-radius: 6px; }
.km-mode { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: color-mix(in srgb, currentColor 6%, transparent); }
.km-mode button { padding: 6px 12px; border: 0; border-radius: 7px; background: transparent; cursor: pointer; font-size: 12px; }
.km-mode-button[aria-pressed="true"] { background: var(--km-accent); color: #fff; }
.km-tabs { display: flex; flex-wrap: wrap; gap: 6px; flex: 0 0 auto; }
.km-tab { padding: 6px 10px; border: 1px solid color-mix(in srgb, currentColor 14%, transparent); border-radius: 999px; background: transparent; cursor: pointer; font-size: 12px !important; }
.km-tab[aria-pressed="true"] { background: var(--km-accent); border-color: var(--km-accent); color: #fff; }
.km-tabs-categories { padding-bottom: 10px; border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
.km-count, .km-hint { font-size: 12px; color: color-mix(in srgb, currentColor 65%, transparent); margin: 0; flex: 0 0 auto; }
.km-scroll { flex: 1 1 auto; overflow: auto; min-height: 0; padding: 2px; overscroll-behavior: contain; }
.km-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(142px, 100%), 1fr)); gap: 8px; }
.km-card { position: relative; border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 12px; overflow: hidden; }
.km-card:hover { background: color-mix(in srgb, currentColor 4%, transparent); border-color: color-mix(in srgb, currentColor 28%, transparent); }
.km-pick { width: 100%; min-height: 88px; padding: 16px 30px 12px 10px; background: transparent; border: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.km-symbol { font-size: 16px; max-width: 100%; overflow-wrap: anywhere; white-space: pre-wrap; line-height: 1.5; }
.km-card.emoji .km-symbol { font-size: 25px; }
.km-card.divider .km-symbol { font-size: 13px; }
.km-label { font-size: 10px; opacity: .62; }
.km-favorite { position: absolute; top: 3px; right: 3px; width: 28px; height: 28px; border: 0; border-radius: 6px; background: transparent; cursor: pointer; font-size: 18px !important; }
.km-favorite[aria-pressed="true"] { color: #b07815; }
.km-favorite:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
.km-root button:focus-visible { outline: 2px solid var(--km-accent); outline-offset: -2px; }
.km-root button:disabled, .km-root button[aria-disabled="true"] { opacity: .5; cursor: wait; }
.km-empty { text-align: center; padding: 32px 12px; }
.km-empty strong { display: block; font-size: 14px; margin-bottom: 8px; }
.km-empty p { font-size: 12px; opacity: .65; margin: 0; line-height: 1.7; }
@media (max-width: 420px) { .km-root { gap: 9px; height: min(620px, 70dvh); } .km-tab { padding: 5px 8px; } .km-grid { gap: 6px; } }
`;
const create = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export default {
  activate(context) {
    let active = true, loaded = false, writable = true, storageIssue = false;
    let writeQueue = Promise.resolve();
    const listeners = new Set();
    const state = { favorites: [], recent: [], mode: "insert" };
    const notify = () => { if (active) listeners.forEach((fn) => fn()); };
    const knownList = (value, limit) => Array.isArray(value)
      ? [...new Set(value.filter((text) => typeof text === "string" && BY_TEXT.has(text)))].slice(0, limit) : [];
    const ready = Promise.resolve().then(async () => {
      try {
        const saved = await context.storage.get(STORAGE_KEY);
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          state.favorites = knownList(saved.favorites, ITEMS.length);
          state.recent = knownList(saved.recent, RECENT_LIMIT);
          state.mode = saved.mode === "copy" ? "copy" : "insert";
        }
      } catch {
        // Do not overwrite saved data when the initial read failed.
        writable = false; storageIssue = true;
      }
      loaded = true; notify();
    });
    function persist() {
      if (!writable) return;
      const snapshot = { favorites: [...state.favorites], recent: [...state.recent], mode: state.mode };
      writeQueue = writeQueue.then(async () => {
        try {
          await context.storage.set(STORAGE_KEY, snapshot);
          if (storageIssue) { storageIssue = false; notify(); }
        } catch {
          if (!storageIssue && active) context.ui.showNotice("收藏和记录暂未保存，下次操作时会重试。");
          storageIssue = true; notify();
        }
      });
    }
    const disposePanel = context.ui.panels.register({
      id: "kaomoji-panel", title: "颜文字", purpose: "dashboard", presentation: "dialog",
      mount(container, { shell }) {
        shell.set({ header: { title: "颜文字", description: "收藏小表情，随手表达好心情" } });
        let mounted = true, filter = "all", query = "", busy = false;
        const root = create("div", "km-root");
        const style = create("style", "", STYLE);
        const toolbar = create("div", "km-toolbar");
        const searchWrap = create("div", "km-search-wrap");
        const search = create("input", "km-search");
        search.type = "search";
        search.placeholder = "搜索心情、emoji 或符号…";
        search.setAttribute("aria-label", "搜索颜文字");
        const clear = create("button", "km-clear", "×");
        clear.type = "button"; clear.hidden = true;
        clear.setAttribute("aria-label", "清空搜索");
        searchWrap.append(search, clear);
        const modes = create("div", "km-mode");
        modes.setAttribute("role", "group"); modes.setAttribute("aria-label", "点击表情时的操作");
        const modeButtons = new Map();
        for (const [mode, label] of [["insert", "插入"], ["copy", "复制"]]) {
          const button = create("button", "km-mode-button", label);
          button.type = "button";
          button.onclick = () => { if (!loaded || busy) return; state.mode = mode; notify(); persist(); };
          modes.append(button); modeButtons.set(mode, button);
        }
        toolbar.append(searchWrap, modes);
        const quickFilters = create("div", "km-tabs");
        quickFilters.setAttribute("aria-label", "常用筛选");
        const categories = create("div", "km-tabs km-tabs-categories");
        categories.setAttribute("aria-label", "表情分类");
        const filterButtons = new Map();
        for (const [id, name] of [["all", "全部"], ["favorites", "收藏"], ["recent", "最近"], ...CATEGORIES.map((c) => [c.id, c.name])]) {
          const button = create("button", "km-tab", name);
          button.type = "button";
          button.onclick = () => { filter = id; scroll.scrollTop = 0; render(); };
          filterButtons.set(id, button);
          (CATEGORIES.some((c) => c.id === id) ? categories : quickFilters).append(button);
        }
        const count = create("p", "km-count");
        count.setAttribute("role", "status"); count.setAttribute("aria-live", "polite");
        const scroll = create("div", "km-scroll");
        const hint = create("p", "km-hint");
        root.append(style, toolbar, quickFilters, categories, count, scroll, hint); container.append(root);
        const updateQuery = () => { query = search.value; clear.hidden = !query; scroll.scrollTop = 0; render(); };
        search.oninput = updateQuery;
        clear.onclick = () => { search.value = ""; updateQuery(); search.focus(); };
        search.onkeydown = (event) => {
          if (event.key === "Escape" && search.value) {
            event.preventDefault(); event.stopPropagation(); search.value = ""; updateQuery();
          }
        };
        async function useItem(item) {
          if (!loaded || busy || !mounted || !active) return;
          busy = true;
          const mode = state.mode;
          render();
          try {
            if (mode === "copy") {
              if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
              await navigator.clipboard.writeText(item.text);
            } else await context.editor.insertAtCursor(item.text);
            state.recent = [item.text, ...state.recent.filter((text) => text !== item.text)].slice(0, RECENT_LIMIT);
            persist();
            if (active) context.ui.showNotice(mode === "copy" ? "已复制，可粘贴到任何地方" : "已插入：" + item.text);
          } catch {
            if (active) context.ui.showNotice(mode === "copy"
              ? "复制失败，请允许剪贴板访问，或切换到插入模式。"
              : "请先打开可编辑的文字笔记，或切换到复制模式。");
          } finally { busy = false; notify(); }
        }
        function render() {
          if (!mounted || !active) return;
          const focused = scroll.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
          for (const [id, button] of filterButtons) {
            button.setAttribute("aria-pressed", String(filter === id));
            if (id === "favorites") button.textContent = `收藏 ${state.favorites.length}`;
            if (id === "recent") button.textContent = `最近 ${state.recent.length}`;
          }
          for (const [mode, button] of modeButtons) {
            button.setAttribute("aria-pressed", String(state.mode === mode)); button.disabled = !loaded || busy;
          }
          root.setAttribute("aria-busy", String(!loaded || busy));
          let visible = filter === "favorites" ? state.favorites.map((text) => BY_TEXT.get(text))
            : filter === "recent" ? state.recent.map((text) => BY_TEXT.get(text))
              : ITEMS.filter((item) => filter === "all" || item.category === filter);
          const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
          visible = visible.filter((item) => terms.every((term) => item.search.includes(term)));
          count.textContent = !loaded ? "正在读取收藏…" : `${visible.length} 个表情 · ${state.mode === "copy" ? "点击复制" : "点击插入"}`;
          hint.textContent = storageIssue ? "收藏和使用记录暂未保存到本机，本次会话仍可使用。"
            : "点 ☆ 收藏常用表情；收藏与最近使用保存在当前设备。";
          const grid = create("div", "km-grid");
          for (const item of visible) {
            const card = create("div", `km-card ${item.kind}`);
            const pick = create("button", "km-pick");
            pick.type = "button"; pick.dataset.focus = `pick-${item.key}`;
            pick.setAttribute("aria-label", `${state.mode === "copy" ? "复制" : "插入"} ${item.text}`);
            pick.title = item.text; pick.disabled = !loaded;
            pick.setAttribute("aria-disabled", String(busy));
            pick.append(create("span", "km-symbol", item.text), create("span", "km-label", item.label));
            pick.onclick = () => useItem(item);
            const isFavorite = state.favorites.includes(item.text);
            const favorite = create("button", "km-favorite", isFavorite ? "★" : "☆");
            favorite.type = "button"; favorite.dataset.focus = `favorite-${item.key}`; favorite.disabled = !loaded;
            favorite.setAttribute("aria-pressed", String(isFavorite));
            favorite.setAttribute("aria-label", `${isFavorite ? "取消收藏" : "收藏"} ${item.text}`);
            favorite.title = isFavorite ? "取消收藏" : "收藏";
            favorite.onclick = () => {
              if (!loaded) return;
              state.favorites = state.favorites.includes(item.text)
                ? state.favorites.filter((text) => text !== item.text) : [...state.favorites, item.text];
              notify(); persist();
            };
            card.append(pick, favorite); grid.append(card);
          }
          if (!visible.length) {
            const empty = create("div", "km-empty");
            const title = query.trim() ? "没有找到匹配的表情" : filter === "favorites" ? "把喜欢的表情留在这里" : "还没有使用记录";
            const detail = query.trim() ? "试试“开心”“生日”或“爱心”，也可以切换到“全部”。"
              : filter === "favorites" ? "点击表情右上角的 ☆，下次就能更快找到。" : "成功插入或复制后，这里会显示最近使用的 24 个表情。";
            empty.append(create("strong", "", title), create("p", "", detail)); scroll.replaceChildren(empty);
          } else scroll.replaceChildren(grid);
          if (focused) {
            const target = [...scroll.querySelectorAll("[data-focus]")].find((node) => node.dataset.focus === focused && !node.disabled);
            (target || filterButtons.get(filter)).focus({ preventScroll: true });
          }
        }
        listeners.add(render); render();
        void ready;
        return () => { mounted = false; listeners.delete(render); root.remove(); };
      },
    });
    const disposeCommand = context.commands.register({
      id: "open-kaomoji", title: "颜文字", listed: true,
      async run() { await context.ui.panels.open("kaomoji-panel"); },
    });
    return () => { active = false; listeners.clear(); disposeCommand(); disposePanel(); };
  },
};
