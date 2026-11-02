// Credits: @jake1

(function () {
  const CONFIG = {
    storageKey: "yapplus_local_usernames",
    usernameSelector:
      '[data-username], [class*="username"], [class*="author"], [class*="displayName"]',
    idAttributes: ["data-user-id", "data-userid", "data-id"],
    menuSelector: '[role="menu"], [class*="contextMenu"], [class*="context-menu"], [class*="ContextMenu"]',
    menuAnchorText: ["Copy User ID", "Copy Message ID", "Reply"],
    menuLabel: "Set local nickname",
    menuIcon:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>' +
      '<path d="m15 5 4 4"/></svg>',
  };

  let nicknames = {};
  let observer = null;
  let menuHandler = null;
  let dialogEl = null;
  function load() {
    try {
      nicknames = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
    } catch (e) {
      nicknames = {};
    }
  }

  function save() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(nicknames));
    } catch (e) {
    }
  }

  function getId(el) {
    for (const attr of CONFIG.idAttributes) {
      const holder = el.closest(`[${attr}]`);
      if (holder) return holder.getAttribute(attr);
    }
    return null;
  }

  function getOriginal(el) {
    if (!el.dataset.luOriginal) el.dataset.luOriginal = el.textContent.trim();
    return el.dataset.luOriginal;
  }

  function getKey(el) {
    const id = getId(el);
    return id ? "id:" + id : "name:" + getOriginal(el);
  }

  function applyTo(el) {
    if (el.children.length > 0 && !el.dataset.luOriginal) return;

    const original = getOriginal(el);
    if (!original) return;

    const nick = nicknames[getKey(el)];
    const wanted = nick || original;

    if (el.textContent !== wanted) el.textContent = wanted;

    if (nick) {
      el.title = `Nickname for ${original}`;
      el.dataset.luApplied = "1";
    } else if (el.dataset.luApplied) {
      el.removeAttribute("title");
      delete el.dataset.luApplied;
    }
  }

  function applyAll(root) {
    (root || document).querySelectorAll(CONFIG.usernameSelector).forEach(applyTo);
  }

  function closeDialog() {
    if (dialogEl) {
      dialogEl.remove();
      dialogEl = null;
    }
  }

  function openDialog(el) {
    closeDialog();
    const original = getOriginal(el);
    const key = getKey(el);

    dialogEl = document.createElement("div");
    dialogEl.style.cssText =
      "position:fixed;inset:0;z-index:999999;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,.5);";

    dialogEl.innerHTML = `
      <div style="background:#2b2d31;color:#fff;padding:16px;border-radius:8px;
                  width:300px;font-family:sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4);">
        <div style="font-weight:600;margin-bottom:8px;">Nickname for <span class="lu-name"></span></div>
        <input class="lu-input" type="text" maxlength="32" placeholder="Leave empty to reset"
               style="width:100%;box-sizing:border-box;padding:8px;border-radius:4px;border:none;
                      background:#1e1f22;color:#fff;outline:none;" />
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
          <button class="lu-cancel" style="padding:6px 12px;border:none;border-radius:4px;
                  background:#4e5058;color:#fff;cursor:pointer;">Cancel</button>
          <button class="lu-save" style="padding:6px 12px;border:none;border-radius:4px;
                  background:#5865f2;color:#fff;cursor:pointer;">Save</button>
        </div>
      </div>`;
    dialogEl.querySelector(".lu-name").textContent = original;
    const input = dialogEl.querySelector(".lu-input");
    input.value = nicknames[key] || "";

    const commit = () => {
      const value = input.value.trim();
      if (value) nicknames[key] = value;
      else delete nicknames[key];
      save();
      closeDialog();
      applyAll();
    };

    dialogEl.querySelector(".lu-save").onclick = commit;
    dialogEl.querySelector(".lu-cancel").onclick = closeDialog;
    dialogEl.addEventListener("mousedown", (e) => {
      if (e.target === dialogEl) closeDialog();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") closeDialog();
    });

    document.body.appendChild(dialogEl);
    input.focus();
  }
  function injectMenuItem(menu, target) {
    if (menu.querySelector("[data-lu-item]")) return true;
    const template = findAnchorRow(menu);
    if (!template || !template.parentElement) return false;

    const item = template.cloneNode(true);
    item.dataset.luItem = "1";
    item.removeAttribute("id");
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    let first = null;
    let slot = null;
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      if (!first) {
        first = n;
        n.textContent = CONFIG.menuLabel;
      } else {
        if (!slot) slot = n.parentElement;
        n.textContent = "";
      }
    }
    if (!first) item.textContent = CONFIG.menuLabel;
    const oldSvg = item.querySelector("svg");
    const icon = makeIcon(oldSvg);
    if (oldSvg) oldSvg.replaceWith(icon);
    else if (slot && slot !== item) slot.replaceChildren(icon);
    else item.appendChild(icon);

    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      } catch (err) {}
      openDialog(target);
    });

    template.after(item);
    return true;
  }
  function makeIcon(oldSvg) {
    const raw = (CONFIG.menuIcon || "").trim();
    if (raw.startsWith("<")) {
      const tpl = document.createElement("template");
      tpl.innerHTML = raw;
      const svg = tpl.content.firstElementChild;
      if (svg && oldSvg) {
        ["class", "width", "height"].forEach((a) => {
          if (oldSvg.hasAttribute(a)) svg.setAttribute(a, oldSvg.getAttribute(a));
        });
      }
      if (svg) return svg;
    }
    const span = document.createElement("span");
    span.textContent = raw || "âœï¸";
    return span;
  }
  function findAnchorRow(menu) {
    for (const text of CONFIG.menuAnchorText) {
      let label = null;
      menu.querySelectorAll("*").forEach((el) => {
        if (el.dataset && el.dataset.luItem) return;
        if (!el.textContent.trim().startsWith(text)) return;
        if (!label || label.contains(el)) label = el;
      });
      if (!label) continue;
      let row = label;
      while (row.parentElement && row.parentElement !== menu.parentElement) {
        if (row.parentElement.children.length >= 6) return row;
        row = row.parentElement;
      }
    }
    return null;
  }
  function waitForMenuAndInject(target) {
    let frames = 0;
    const tick = () => {
      const menus = document.querySelectorAll(CONFIG.menuSelector);
      const menu = menus[menus.length - 1];
      if (menu && injectMenuItem(menu, target)) return;
      if (++frames < 30) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function start() {
    if (observer) return;
    load();
    applyAll();

    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(CONFIG.usernameSelector)) applyTo(node);
          if (node.querySelectorAll) applyAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    menuHandler = (e) => {
      const el = e.target.closest && e.target.closest(CONFIG.usernameSelector);
      if (!el) return;
      waitForMenuAndInject(el);
    };
    document.addEventListener("contextmenu", menuHandler, true);
  }

  function stop() {
    if (observer) observer.disconnect();
    observer = null;
    if (menuHandler) document.removeEventListener("contextmenu", menuHandler, true);
    menuHandler = null;
    closeDialog();
    document.querySelectorAll("[data-lu-original]").forEach((el) => {
      el.textContent = el.dataset.luOriginal;
      el.removeAttribute("title");
      delete el.dataset.luApplied;
    });
  }
  PluginHost.register({
    id: "localusernames",
    name: "Local Usernames",
    description: "Give people nicknames only you can see (right-click an username). (made by @jake1)",
    start,
    stop,
  });
})();