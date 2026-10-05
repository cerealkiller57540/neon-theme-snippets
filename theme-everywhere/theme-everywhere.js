/*
 * theme-everywhere: the Settings, Developer tools, Logbook and Media pages inherit the active
 * theme. Full-screen `lovelace-background` (so it shows under a translucent sidebar, like on a
 * dashboard), glass panels instead of opaque bands, neon header.
 *
 * Everything lives in shadow roots that neither themes nor card-mod can reach. We adopt style
 * sheets there that only read theme variables (var()): the browser resolves them, so a theme or
 * background change follows without reloading anything. Missing variable = original rendering.
 *
 * Load it with `frontend: extra_module_url` (it is an ES module). Options, in the URL:
 *   ?signal_lost=0   no "SIGNAL LOST" screen, Home Assistant's own connection toast is kept
 *   ?neon=0          no pulsing header, neon scrollbars or tinted text selection
 * e.g. /local/theme-everywhere.js?v=1&signal_lost=0
 *
 * https://github.com/cerealkiller57540/neon-theme-snippets (MIT)
 */
const THEME_EVERYWHERE_OPTS = (() => {
  let q;
  try {
    q = new URL(import.meta.url).searchParams;
  } catch (e) {
    q = new URLSearchParams();
  }
  const on = (k) => !/^(0|false|off|no)$/i.test(q.get(k) || "");
  return { signalLost: on("signal_lost"), neon: on("neon") };
})();

(() => {
  if (window.__themeEverywhere) return;
  window.__themeEverywhere = true;
  const OPTS = THEME_EVERYWHERE_OPTS;

  // Fixed full-screen layer (like hui-view-background). The original :host is made transparent,
  // otherwise it would hide the layer placed behind it.
  const BG =
    ":host{background:transparent !important}" +
    ":host::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;" +
    "background:var(--lovelace-background,var(--primary-background-color))}";

  // Header: neon bottom border, pulsing glow, blur (same treatment as a themed dashboard header).
  const HDR = !OPTS.neon ? "" :
    "@keyframes neo-hdr-pulse{" +
    "0%,100%{border-bottom-color:rgba(var(--rgb-primary-color),1);" +
    "box-shadow:0 0 6px rgba(var(--rgb-primary-color),.9),0 2px 18px rgba(var(--rgb-primary-color),.55)," +
    "0 4px 40px rgba(var(--rgb-primary-color),.25)}" +
    "50%{border-bottom-color:var(--blacklight-color,#B400FF);" +
    "box-shadow:0 0 10px var(--blacklight-color,#B400FF)," +
    "0 2px 28px color-mix(in srgb,var(--blacklight-color,#B400FF) 75%,transparent)," +
    "0 4px 55px rgba(var(--rgb-primary-color),.4)}}" +
    ".top-app-bar,.toolbar{border-bottom:2px solid rgba(var(--rgb-primary-color),1) !important;" +
    "-webkit-backdrop-filter:var(--app-header-backdrop-filter,none);" +
    "backdrop-filter:var(--app-header-backdrop-filter,none);" +
    "animation:neo-hdr-pulse 4s ease-in-out infinite}" +
    // Tablets and phones: no continuous animation
    "@media (max-width:767px),(hover:none) and (pointer:coarse){" +
    ".top-app-bar,.toolbar{animation:none !important;box-shadow:0 0 8px rgba(var(--rgb-primary-color),.5)}}";

  // Text selection and caret: LIGHT theme tints (--rgb-lavande, --rgb-blacklight-color). A dark
  // primary is hard to see on a black background. Falls back to the primary color when missing.
  // Applied to EVERY shadow root (::selection does not cross shadow boundaries) and the document.
  const LAV = "var(--rgb-lavande,var(--rgb-primary-color))";
  const BLK = "var(--rgb-blacklight-color,var(--rgb-primary-color))";
  const PRI = "var(--rgb-primary-color)";
  const SEL = !OPTS.neon ? "" :
    ":host,html{caret-color:rgb(" + LAV + ")}" +
    "input,textarea{caret-color:rgb(" + LAV + ") !important}" +
    "::selection{background:rgba(" + BLK + ",.6);color:var(--primary-text-color);" +
    "text-shadow:0 0 8px rgba(" + LAV + ",1)}" +
    // Neon scrollbars. Chrome ignores ::-webkit-scrollbar as soon as scrollbar-color/width are set
    // (many themes do): reset them to auto to keep the gradient and glow.
    "*{scrollbar-color:auto !important;scrollbar-width:auto !important}" +
    "::-webkit-scrollbar{width:7px !important;height:7px !important;background:transparent !important}" +
    "::-webkit-scrollbar-track{background:rgba(" + PRI + ",.08) !important;border-radius:4px !important}" +
    "::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgb(" + PRI + "),rgb(" + BLK + ")) !important;" +
    "border-radius:4px !important;box-shadow:0 0 6px rgba(" + PRI + ",.7) !important}" +
    "::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,rgb(" + BLK + "),rgb(" + LAV + ")) !important;" +
    "box-shadow:0 0 10px rgba(" + BLK + ",.9) !important}" +
    "::-webkit-scrollbar-corner{background:transparent}" +
    // YAML editor (CodeMirror 6)
    ".cm-cursor,.cm-dropCursor{border-left:2px solid rgb(" + LAV + ") !important;" +
    "box-shadow:0 0 8px rgb(" + LAV + ")}" +
    ".cm-selectionBackground,.cm-focused>.cm-scroller>.cm-selectionLayer .cm-selectionBackground{" +
    "background:rgba(" + BLK + ",.5) !important}";

  // Blocks sitting bare on the background (unreadable on an image): same glass as ha-card.
  const GLASS =
    "background:var(--ha-card-background,var(--card-background-color)) !important;" +
    "-webkit-backdrop-filter:var(--ha-card-backdrop-filter,none);backdrop-filter:var(--ha-card-backdrop-filter,none);" +
    "border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,transparent);" +
    "border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);box-sizing:border-box";
  // Section title sitting bare on the image: card-background halo to lift it off.
  const HALO = "text-shadow:0 0 4px rgba(var(--rgb-card-background-color,0,0,0),1),0 0 10px rgba(var(--rgb-card-background-color,0,0,0),1),0 0 18px rgba(var(--rgb-card-background-color,0,0,0),.9)";
  const H3 = "h3{color:var(--primary-text-color) !important;" + HALO + "}";
  // Bare titles/paragraphs (section landing pages, empty states): halo only, no box.
  const BARE = "h1,h2,.empty p,.empty h1{color:var(--primary-text-color) !important;" + HALO + "}.empty{" + GLASS + ";padding:24px 32px !important;width:fit-content !important;height:fit-content !important;max-width:640px;margin:auto !important;align-self:center}.empty a{color:rgb(" + LAV + ") !important}";
  const CLOUD = ".pitch,.actions,.footnote{" + GLASS + ";padding:16px 20px !important}.actions{align-self:start}a{color:rgb(" + LAV + ") !important}";
  const SECTION = "ha-config-section>span:first-child{color:var(--primary-text-color) !important;" + HALO + "}ha-config-section>span:nth-of-type(2){" + GLASS + ";padding:12px 16px !important;display:block}ha-config-section a{color:rgb(" + LAV + ") !important}";
  const PAGE = ".header{" + GLASS + ";padding:12px 16px !important}" + H3 +
    // Section titles ("Attention required", "Services") and "No entries": bare on the image, a halo
    // is not enough → glass pill fitted to the text, like .empty.
    ".section-header,.no-entries{" + GLASS + ";width:fit-content !important;padding:6px 14px !important;box-sizing:border-box}.no-entries{" + HALO + ";margin:6px 0 6px 16px !important}" +
    ".header a{color:rgb(" + LAV + ") !important}";
  const TIP = "ha-tip{" + GLASS + ";padding:6px 12px !important}ha-tip a{color:rgb(" + LAV + ") !important}";
  const TIPLINK = "a{color:rgb(" + LAV + ") !important}";
  // Logbook: date bar and filter header painted in opaque primary background. The list itself
  // goes under glass: times and areas (grey secondary text) got lost on the image.
  const LOGBOOK = ".toolbar{background:transparent !important}" +
    "ha-logbook{" + GLASS + ";margin:0 12px 12px 0;overflow:hidden}" +
    "ha-filter-pane{" + GLASS + ";margin:0 12px 12px 12px;overflow:hidden}";
  const FILTER = ".header{background:transparent !important}";
  // Integration in error ("Attention required"): the row only has a 20 % warning tint, bare on the
  // image. Theme glass underneath, warning tint kept on top.
  const ATTN = ":host(.attention) ha-md-list{" + GLASS + ";background:linear-gradient(" +
    "color-mix(in srgb,var(--warning-color,#ffb800) 14%,transparent)," +
    "color-mix(in srgb,var(--warning-color,#ffb800) 14%,transparent))," +
    "var(--ha-card-background,var(--card-background-color)) !important;" +
    "border-color:color-mix(in srgb,var(--warning-color,#ffb800) 45%,transparent) !important}";
  // Integrations search bar: band painted in opaque primary background (black stripe over the
  // image). Same glass as cards, thin primary line at the bottom to separate it from the grid.
  const SEARCH = ".search{" + GLASS + ";border-radius:0 !important;border-width:0 0 1px 0 !important;" +
    "border-color:rgba(var(--rgb-primary-color),.35) !important;box-shadow:none !important}";
  // Data tables (Devices, Entities, Automations, Helpers…): toolbar and group titles painted in
  // opaque primary background on top of the glass already on the table. Made transparent (no
  // second glass, which would double the darkening); primary line / tint instead.
  const TABLEBAR = ".table-header{background:transparent !important;" +
    "border-bottom:1px solid rgba(var(--rgb-primary-color),.35) !important}";
  const GROUP = ".group-header{background:rgba(var(--rgb-primary-color),.12) !important}";
  // Home Assistant's "connection lost" toast would sit on top of the SIGNAL LOST screen: hidden,
  // only when that screen is enabled.
  const TOAST = !OPTS.signalLost ? "" :
    'ha-toast[data-notification-key="identified-connection-lost"]{display:none !important}';

  // Notification drawer: the list paints an opaque fill over the drawer surface; it is cleared and
  // the drawer (wa-drawer, part=dialog) gets the theme glass (instead of the near-opaque
  // --wa-color-surface-raised).
  const NOTIF = ".notifications{background:transparent !important}";
  const DRAWER = "[part=dialog]{background:var(--ha-card-background,var(--card-background-color)) !important;" +
    "-webkit-backdrop-filter:var(--ha-card-backdrop-filter,none);" +
    "backdrop-filter:var(--ha-card-backdrop-filter,none)}";

  // Developer tools > States: title + checkboxes, "Set state" and column titles bare on the
  // image; table rows already have their own translucent background (no second glass).
  const STATES = ".heading{" + GLASS + ";padding:0 var(--ha-space-4);margin:0 var(--ha-space-2) var(--ha-space-4)}" +
    "ha-expansion-panel{" + GLASS + "}";
  const STATEROWS = '.row[aria-rowindex="1"] .header{background:var(--table-row-alternative-background-color) !important}';

  // Media in list mode: ha-list-item rows (in a lit-virtualizer) are bare on the image. Glass per
  // row, spaced. HA sets the virtualizer height to n × 72 + 26 px inline and the virtualizer
  // counts margins: 64 + 8 margin = 72, otherwise the last row is cut off.
  const MEDIALIST = "ha-list-item{" + GLASS + ";height:64px !important;margin:0 16px 8px;" +
    "width:calc(100% - 32px) !important}";

  // HA toasts ("Starting…", etc.): hard-coded --ha-color-neutral-10 background → theme glass.
  const TOASTGLASS = ".toast{" + GLASS + "}";

  // Apps pages: the host paints its own opaque background, hiding hass-subpage's layer.
  const APPS = ":host{background:transparent !important}" + SEARCH;

  // Automation/script traces: .main contains an opaque .graph and a translucent .info (stacked
  // darkening). One glass on .main, the rest transparent.
  const TRACE = ".main{" + GLASS + ";border:0 !important;border-radius:0 !important;box-shadow:none !important}" +
    ".toolbar,.graph,.info,ha-tab-group{background:transparent !important}";

  // CSS per host tag (as text: sheets are built PER window, see install()).
  const PLAN = {
    "HASS-TABS-SUBPAGE": [BG, HDR],
    "HASS-SUBPAGE": [BG, HDR],
    "HA-CONFIG-DASHBOARD": [BG, TIP],
    "HA-CONFIG-INTEGRATION-PAGE": [PAGE],
    "HA-TIP": [TIPLINK],
    "CLOUD-START": [CLOUD],
    "HA-CONFIG-PERSON": [SECTION],
    "HA-SCENE-DASHBOARD": [BARE],
    "HA-CONFIG-AREAS-DASHBOARD": [BARE],
    "THREAD-CONFIG-PANEL": [BARE],
    "HA-TOP-APP-BAR-FIXED": [HDR],
    "HA-PANEL-LOGBOOK": [BG, LOGBOOK],
    "HA-FILTER-PANE": [FILTER],
    "NOTIFICATION-MANAGER": [TOAST],
    "HA-TOAST": [TOASTGLASS],
    "HA-CONFIG-ENTRY-ROW": [ATTN],
    "HA-CONFIG-INTEGRATIONS-DASHBOARD": [SEARCH],
    "HASS-TABS-SUBPAGE-DATA-TABLE": [TABLEBAR],
    "HA-DATA-TABLE": [GROUP],
    "HA-CONFIG-APPS-INSTALLED": [APPS],
    "HA-CONFIG-APPS-AVAILABLE": [APPS],
    "HA-CONFIG-APPS-REGISTRIES": [APPS],
    "HA-CONFIG-APPS-REPOSITORIES": [APPS],
    "HA-AUTOMATION-TRACE": [TRACE],
    "HA-SCRIPT-TRACE": [TRACE],
    "HA-TRACE-PATH-DETAILS": ["ha-tab-group{background:transparent !important}"],
    // Developer tools (YAML, States, Actions, Template…): the whole chain is transparent, nothing
    // paints a background.
    "HA-PANEL-TOOLS": [BG],
    // Media (/media-browser): same case.
    "HA-PANEL-MEDIA-BROWSER": [BG],
    "HA-MEDIA-PLAYER-BROWSE": [MEDIALIST],
    "TOOLS-STATE": [STATES],
    "TOOLS-STATE-RENDERER": [STATEROWS],
    "NOTIFICATION-DRAWER": [NOTIF],
    "WA-DRAWER": [DRAWER],
  };

  // Custom panel iframes (HACS…): a separate document where extra_module_url is never loaded.
  // ha-panel-custom puts them in home-assistant-main's tree.
  const watchFrames = (root) => {
    const seen = new WeakSet();
    const hook = (f) => {
      try {
        install(f.contentWindow);
      } catch (e) {
        /* cross-origin iframe: nothing to do */
      }
    };
    const scan = () => {
      for (const f of root.querySelectorAll("ha-panel-custom iframe")) {
        if (seen.has(f)) continue;
        seen.add(f);
        f.addEventListener("load", () => hook(f));
        const d = f.contentDocument;
        if (d && d.readyState === "complete" && d.body && d.body.childElementCount) hook(f);
      }
    };
    new MutationObserver((ms) => {
      if (ms.some((m) => m.addedNodes.length)) scan();
    }).observe(root, { childList: true, subtree: true });
    scan();
  };

  // Installs the hook in a window (the page, then each custom panel iframe). A constructed
  // CSSStyleSheet can only be adopted in its own document: sheets are per window.
  const install = (win) => {
    if (!win || win.__themeEverywhereSheets) return;
    const desc = Object.getOwnPropertyDescriptor(win.ShadowRoot.prototype, "adoptedStyleSheets");
    if (!desc || !desc.get || !desc.set) return;
    win.__themeEverywhereSheets = true;
    const cache = new Map();
    const mk = (css) => {
      if (!cache.has(css)) {
        const s = new win.CSSStyleSheet();
        s.replaceSync(css);
        cache.set(css, s);
      }
      return cache.get(css);
    };
    const sel = mk(SEL);

    // Lit rewrites adoptedStyleSheets on every render: keep our sheets last.
    const adopt = (host, root) => {
      const mine = [sel, ...(PLAN[host.tagName] || []).map(mk)];
      Object.defineProperty(root, "adoptedStyleSheets", {
        configurable: true,
        get() {
          return desc.get.call(this);
        },
        set(v) {
          desc.set.call(this, [...v.filter((s) => !mine.includes(s)), ...mine]);
        },
      });
      root.adoptedStyleSheets = desc.get.call(root);
      if (host.tagName === "HOME-ASSISTANT-MAIN") watchFrames(root);
    };

    const attach = win.Element.prototype.attachShadow;
    win.Element.prototype.attachShadow = function (init) {
      const root = attach.call(this, init);
      adopt(this, root);
      return root;
    };
    win.document.adoptedStyleSheets = [...win.document.adoptedStyleSheets, sel];

    // Shadow roots rendered before us (the HACS iframe builds its own before its load event).
    const walk = (n) => {
      for (const el of n.querySelectorAll("*")) {
        if (!el.shadowRoot) continue;
        adopt(el, el.shadowRoot);
        walk(el.shadowRoot);
      }
    };
    walk(win.document);
  };

  install(window);
})();

/*
 * "SIGNAL LOST" screen: when the connection to the backend drops, a blurred full-screen veil
 * with scanlines and GLITCH the cat as a hologram (offset red/cyan layers, jitter). When it comes
 * back: a wink, "SIGNAL RESTORED", then a fade out.
 * Everything is inline: during an outage, /local is not served anymore.
 */
(() => {
  if (!THEME_EVERYWHERE_OPTS.signalLost || window.__themeEverywhereLost) return;
  window.__themeEverywhereLost = true;

  const FX = { blur: 8, dim: 0.55, desat: 0.6, scan: 0.18, size: 240, hue: 152, split: 5, cycle: 2.8, glow: 18 };
  const DELAY = 1500; // ignore micro-outages
  const OUT = 1400; // how long "SIGNAL RESTORED" stays before the fade

  // GLITCH (pixel art 51×46): head that can move above the paws + eyelid for the wink.
  const CAT = "M15.724 15.662h5.454v5.454h5.455v-5.454h5.457v-5.455h5.455v5.455h-.001v10.91h-.003l.004.001v5.455l-.006.002h5.46v5.455H26.636V32.03h5.455v-5.458h-5.455v5.456h-5.456v-5.455l.006-.001h-5.461v5.458h5.455v5.455H4.813V32.03h5.462l-.006-.002v-5.455l.005-.001h-.006v-10.91h.001v-5.455h5.455v5.455Z";
  const HEAD = "M10.268 10.207h5.455v5.455h-5.455ZM32.086 10.207h5.455v5.455h-5.455ZM10.268 15.662h5.455v5.455h-5.455ZM15.722 15.662h5.455v5.455h-5.455ZM26.631 15.662h5.455v5.455h-5.455ZM32.086 15.662h5.455v5.455h-5.455ZM10.268 21.116h5.455v5.455h-5.455ZM15.722 21.116h5.455v5.455h-5.455ZM21.177 21.116h5.455v5.455h-5.455ZM26.631 21.116h5.455v5.455h-5.455ZM32.086 21.116h5.455v5.455h-5.455ZM10.268 26.571h5.455v5.455h-5.455ZM21.177 26.571h5.455v5.455h-5.455ZM32.086 26.571h5.455v5.455h-5.455Z";
  const PAWS = "M4.813 32.025h5.455v5.455h-5.455ZM10.268 32.025h5.455v5.455h-5.455ZM15.722 32.025h5.455v5.455h-5.455ZM26.631 32.025h5.455v5.455h-5.455ZM32.086 32.025h5.455v5.455h-5.455ZM37.540 32.025h5.455v5.455h-5.455Z";
  const LID = "M26.631 26.571h5.455v5.455h-5.455Z";
  const ghost = (c) => `<svg viewBox="0 0 51 46" class="cat ${c}"><path fill="currentColor" d="${CAT}"/></svg>`;

  const CSS = `
  :host{all:initial}
  .veil{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;
    pointer-events:none;opacity:0;transition:opacity .5s;
    -webkit-backdrop-filter:blur(${FX.blur}px) grayscale(${FX.desat});backdrop-filter:blur(${FX.blur}px) grayscale(${FX.desat});
    background:rgba(0,0,0,${FX.dim});--c:hsl(${FX.hue} 90% 62%);--g:${FX.glow}px;--s:${FX.split}px;color:var(--c);
    font-family:'Orbitron','Eurostile','Bahnschrift','DIN Alternate','Franklin Gothic Medium',system-ui,sans-serif}
  .veil[hidden]{display:none}
  .on{opacity:1;animation:boot .9s steps(1) both}
  .veil::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:${FX.scan};mix-blend-mode:overlay;
    background:repeating-linear-gradient(0deg,rgba(255,255,255,.9) 0 1px,transparent 1px 4px);background-size:100% 4px;animation:scan 7s linear infinite}
  @keyframes boot{0%{opacity:0}8%{opacity:.6}14%{opacity:.1}22%{opacity:.9}30%{opacity:.4}40%,100%{opacity:1}}
  @keyframes scan{to{background-position:0 160px}}
  .catbox{position:relative;width:min(${FX.size}px,45vw);aspect-ratio:51/46;
    filter:drop-shadow(0 0 calc(var(--g)*.5) var(--c)) drop-shadow(0 0 var(--g) var(--c))}
  .cat{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
  .rd,.cy{mix-blend-mode:screen;opacity:.75}
  .rd{color:#ff2d6b;animation:rd ${FX.cycle}s steps(1) infinite}
  .cy{color:#00e5ff;animation:cy ${FX.cycle}s steps(1) infinite}
  .main{animation:jit ${FX.cycle}s steps(1) infinite}
  @keyframes rd{0%,100%{transform:translate(calc(var(--s)*-1),0)}17%{transform:translate(calc(var(--s)*-1.8),1px)}35%{transform:translate(calc(var(--s)*-.4),0)}61%{transform:translate(calc(var(--s)*-1.5),-1px)}82%{transform:translate(calc(var(--s)*-.8),0)}}
  @keyframes cy{0%,100%{transform:translate(var(--s),0)}22%{transform:translate(calc(var(--s)*.4),-1px)}44%{transform:translate(calc(var(--s)*1.7),0)}70%{transform:translate(calc(var(--s)*.9),1px)}88%{transform:translate(calc(var(--s)*1.4),0)}}
  @keyframes jit{0%,100%{transform:none;clip-path:none;opacity:1}12%{clip-path:inset(18% 0 52% 0);transform:translateX(3px)}15%{clip-path:none;transform:none}48%{opacity:.7}50%{opacity:1}63%{clip-path:inset(60% 0 8% 0);transform:translateX(-4px)}66%{clip-path:none;transform:none}}
  .head{animation:nod 7s ease-in-out infinite}
  @keyframes nod{0%,60%{transform:translateY(0)}72%{transform:translateY(10.9px)}84%,100%{transform:translateY(0)}}
  .lid{transform-box:fill-box;transform-origin:center top;transform:scaleY(0)}
  .wink .lid{animation:wink .5s ease-in-out 2}
  @keyframes wink{0%,100%{transform:scaleY(0)}50%{transform:scaleY(1)}}
  .msg{text-align:center;text-shadow:0 0 calc(var(--g)*.4) var(--c),0 0 var(--g) var(--c)}
  .msg b{display:block;font-size:clamp(22px,6vw,44px);letter-spacing:.22em;font-weight:700;color:#fff}
  .msg span{display:block;margin-top:10px;font:clamp(12px,2.6vw,18px) 'JetBrains Mono','Cascadia Mono','Consolas','SF Mono',ui-monospace,monospace;letter-spacing:.18em;color:var(--c)}
  @media (prefers-reduced-motion:reduce){.veil *,.veil::after,.on{animation:none !important}}`;

  let host, veil, title, cnt, tick, outT, showT, t0;
  const build = () => {
    host = document.createElement("div");
    host.id = "theme-everywhere-lost";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CSS}</style><div class="veil" hidden role="status" aria-live="polite">
      <div class="catbox">${ghost("rd")}${ghost("cy")}<svg viewBox="0 0 51 46" class="cat main"><defs><clipPath id="nl-clip"><rect x="0" y="-10" width="51" height="42.025"/></clipPath></defs>
      <g clip-path="url(#nl-clip)"><g class="head"><path fill="currentColor" d="${HEAD}"/><path class="lid" fill="currentColor" d="${LID}"/></g></g>
      <path fill="currentColor" d="${PAWS}"/></svg></div>
      <div class="msg"><b></b><span></span></div></div>`;
    document.body.appendChild(host);
    veil = root.querySelector(".veil");
    title = root.querySelector(".msg b");
    cnt = root.querySelector(".msg span");
  };
  const count = () => {
    const s = Math.floor((Date.now() - t0) / 1000);
    cnt.textContent = "reconnecting · " + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };
  const show = () => {
    if (!host) build();
    clearTimeout(outT);
    title.textContent = "SIGNAL LOST";
    count();
    tick = setInterval(count, 1000);
    veil.classList.remove("wink", "on");
    veil.hidden = false;
    void veil.offsetWidth;
    veil.classList.add("on");
  };
  const hide = () => {
    clearInterval(tick);
    title.textContent = "SIGNAL RESTORED";
    cnt.textContent = "connection · ok";
    veil.classList.add("wink");
    outT = setTimeout(() => {
      veil.classList.remove("on");
      outT = setTimeout(() => { veil.hidden = true; veil.classList.remove("wink"); }, 500);
    }, OUT);
  };

  // State read from hass.connected (set by the frontend on disconnected/ready): no listener to
  // re-attach if the connection object changes.
  let down = false, shown = false;
  setInterval(() => {
    const hass = document.querySelector("home-assistant")?.hass;
    if (!hass) return;
    if (hass.connected === false && !down) {
      down = true;
      t0 = Date.now();
      showT = setTimeout(() => { shown = true; show(); }, DELAY);
    } else if (hass.connected !== false && down) {
      down = false;
      clearTimeout(showT);
      if (shown) { shown = false; hide(); }
    }
  }, 250);
})();
