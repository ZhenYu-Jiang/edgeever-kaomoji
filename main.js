// 颜文字面板插件
// 分类展示颜文字 / emoji / 分割线，点击插入光标处。
export default {
  activate(context) {
    const STYLE = `
.km-root { font-family: inherit; color: inherit; display: grid; grid-template-rows: auto minmax(0,1fr); gap: 12px; height: min(560px, 68dvh); padding: 2px; }
.km-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.km-tab { padding: 6px 11px; border-radius: 999px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); background: transparent; color: inherit; font: inherit; font-size: 12px; cursor: pointer; }
.km-tab.active { background: #3f7d5c; border-color: #3f7d5c; color: #fff; }
.km-scroll { overflow: auto; min-height: 0; }
.km-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; padding: 2px; }
.km-item { min-height: 44px; padding: 8px 6px; border: 1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius: 8px; background: transparent; color: inherit; font: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; white-space: nowrap; }
.km-item:hover { background: color-mix(in srgb, currentColor 6%, transparent); border-color: color-mix(in srgb, currentColor 20%, transparent); }
.km-item.emoji { font-size: 22px; }
.km-item.divider { font-size: 12px; color: color-mix(in srgb, currentColor 55%, transparent); }
.km-hint { font-size: 12px; color: color-mix(in srgb, currentColor 50%, transparent); }
`;

    const CATEGORIES = [
      { name: "开心", items: ["(＾▽＾)", "(⌒▽⌒)", "(*^▽^*)", "(≧▽≦)", "(●'◡'●)", "(◠‿◠)", "(๑•̀ㅂ•́)و✧", "(ノ≧∇≦)ノ", "^_^", "(^人^)"] },
      { name: "卖萌", items: ["(｡•̀ᴗ-)✧", "(◕ᴗ◕✿)", "(≧◡≦)", "(つ≧▽≦)つ", "(๑•́ ₃ •̀๑)", "(´｡• ω •｡`)", "(￣ω￣)", "(˶ᵔ ᵕ ᵔ˶)", "(=^･ω･^=)", "(・ω・)ノ"] },
      { name: "难过", items: ["(｡•́︿•̀｡)", "(T_T)", "(T⌓T)", "(╥_╥)", "(´;ω;｀)", "(ಥ_ಥ)", "(个_个)", "( ；∀；)", "(╯︵╰,)"] },
      { name: "惊讶", items: ["(⊙_⊙)", "(⊙﹏⊙)", "(O_O)", "Σ(°△°|||)", "(◎_◎;)", "(⊙_◎)", "(•̀ᴗ•́)و", "(ﾟДﾟ)", "(⊙.☉)"] },
      { name: "生气", items: ["(｀へ´)", "(¬_¬\")", "(≖_≖)", "(눈_눈)", "(｀⌒´メ)", "(╬ Ò﹏Ó)", "(￢_￢)", "(≧皿≦)"] },
      { name: "爱心", items: ["(´∀｀)♡", "(♡˙︶˙♡)", "(っ˘з(˘⌣˘ )♡", "(灬º‿º灬)♡", "(｡♡‿♡｡)", "(♥ω♥ )", "(づ｡◕‿‿◕｡)づ"] },
      { name: "无奈", items: ["¯\\_(ツ)_/¯", "(￣▽￣)~*", "(；一_一)", "(・_・;)", "(￣ヘ￣)", "(・へ・)", "┐(´д｀)┌", "(´-ω-`)"] },
      { name: "累困", items: ["(－ω－) zzZ", "(∪｡∪)｡｡｡zzZ", "(＿ ＿*) Z z z", "(￣o￣) . z Z", "(－_－) zzZ", "(。-ω-)zzz"] },
      { name: "动物", items: ["ʕ•ᴥ•ʔ", "(ᵔᴥᵔ)", "ʕ•́ᴥ•̀ʔっ", "(=^･ｪ･^=)", "(^･ｪ･^)", "U･ｪ･U", "(='ｘ'=)"] },
      { name: "emoji", kind: "emoji", items: ["✨", "🌟", "💫", "⭐", "🌈", "🌸", "🌿", "🍀", "🌻", "🍃", "🔥", "💡", "🎯", "✅", "☑️", "⚠️", "❗", "❓", "📌", "📝", "🏷️", "🔖", "💚", "❤️", "💙", "💛", "🧡", "💜", "🤍", "🎉", "🎊", "🎂", "🥳"] },
      { name: "分割线", kind: "divider", items: ["───────────", "─── ✦ ───", "· · ─────── · ·", "═══════════", "── ⋆⋅☆⋅⋆ ──", "﹏﹏﹏﹏﹏﹏﹏", "✧ ──────── ✧"] },
    ];

    const disposePanel = context.ui.panels.register({
      id: "kaomoji-panel",
      title: "颜文字",
      purpose: "dashboard",
      presentation: "dialog",
      mount(container, { shell }) {
        shell.set({
          header: { title: "颜文字", description: "点击即插入光标处，可连续点选" },
        });

        const style = document.createElement("style");
        style.textContent = STYLE;
        const root = document.createElement("div");
        root.className = "km-root";
        root.append(style);
        container.append(root);

        const tabs = document.createElement("div");
        tabs.className = "km-tabs";
        root.append(tabs);

        const scroll = document.createElement("div");
        scroll.className = "km-scroll";
        root.append(scroll);

        const hint = document.createElement("div");
        hint.className = "km-hint";
        hint.textContent = "插入后可在正文里直接编辑。";
        root.append(hint);

        let current = 0;
        function renderTabs() {
          tabs.replaceChildren();
          CATEGORIES.forEach((cat, i) => {
            const b = document.createElement("button");
            b.className = "km-tab" + (i === current ? " active" : "");
            b.textContent = cat.name;
            b.onclick = () => { current = i; renderTabs(); renderItems(); };
            tabs.append(b);
          });
        }
        function renderItems() {
          scroll.replaceChildren();
          const cat = CATEGORIES[current];
          const grid = document.createElement("div");
          grid.className = "km-grid";
          for (const item of cat.items) {
            const b = document.createElement("button");
            b.className = "km-item" + (cat.kind ? " " + cat.kind : "");
            b.textContent = item;
            b.title = item;
            b.onclick = async () => {
              try {
                await context.editor.insertAtCursor(item);
                context.ui.showNotice("已插入：" + item);
              } catch (e) {
                context.ui.showNotice("插入失败：请先打开一篇笔记并进入编辑状态");
              }
            };
            grid.append(b);
          }
          scroll.append(grid);
        }

        renderTabs();
        renderItems();
        return () => root.remove();
      },
    });

    const disposeCmd = context.commands.register({
      id: "open-kaomoji",
      title: "颜文字",
      listed: true,
      async run() {
        await context.ui.panels.open("kaomoji-panel");
      },
    });

    return () => {
      disposeCmd();
      disposePanel();
    };
  },
};
