const quickmention = {
  id: 'quickmention',
  name: 'Quick Mention',
  description: 'Are you tired of typing your friends username every time you want to mention them? well, this adds a lil @ button so its easier!',
  observer: null,
  styleEl: null,
  svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,

  start() {
    if (this.observer) return;
    
    if (!document.getElementById('yp-qm-css')) {
      this.styleEl = document.createElement('style');
      this.styleEl.id = 'yp-qm-css';
      this.styleEl.textContent = `
        .yp-quickmention-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-muted, #b5bac1);
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        .yp-quickmention-btn:hover {
          background: var(--bg-modifier-hover, #4e5058);
          color: var(--text-normal, #dbdee1);
        }
      `;
      document.head.appendChild(this.styleEl);
    }

    const self = this;
    
    this.scan = () => {
      document.querySelectorAll('.msg[data-message-id]').forEach(msg => {
        const block = msg.closest('.msg-block');
        if (!block) return;
        
        const actionsBar = block.querySelector('.msg-actions');
        if (!actionsBar || actionsBar.querySelector('.yp-quickmention-btn')) return;

        const authorEl = msg.querySelector('.msg-author');
        if (!authorEl) return;
        const username = authorEl.textContent.trim().replace('@', '');

        let userId = '';
        const avatarImg = msg.querySelector('.msg-gutter img');
        if (avatarImg && avatarImg.src) {
          const match = avatarImg.src.match(/avatars\/([0-9a-f-]{36})\//i);
          if (match) userId = match[1];
        }

        const btn = document.createElement('button');
        btn.className = 'yp-quickmention-btn';
        btn.title = `Mention @${username}`;
        btn.innerHTML = self.svgIcon;

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          self.triggerMention(username, userId);
        });

        const replyBtn = actionsBar.querySelector('button[title="Reply"], button[aria-label="Reply"], button[title="reply"], button[aria-label="reply"]');
        const moreBtn = actionsBar.querySelector('button[title="More"], button[aria-label="More"], button[title="More options"], button[aria-haspopup="menu"]');

        if (replyBtn) {
          replyBtn.after(btn);
        } else if (moreBtn) {
          moreBtn.before(btn);
        } else {
          actionsBar.appendChild(btn);
        }
      });
    };

    this.observer = new MutationObserver(() => self.scan());
    this.observer.observe(document.body, { childList: true, subtree: true });
    
    this.scan();
  },

  triggerMention(username, userId) {
    const textarea = document.querySelector('.composer textarea') || document.querySelector('.composer-box textarea') || document.querySelector('textarea.msg-input') || document.querySelector('[contenteditable="true"]');
    if (!textarea) return;

    textarea.focus();
    const mention = userId ? `<@${userId}> ` : `@${username} `;
    
    if (textarea.tagName.toLowerCase() === 'textarea') {
      const start = textarea.selectionStart || textarea.value.length;
      const end = textarea.selectionEnd || textarea.value.length;
      const text = textarea.value;
      const newValue = text.substring(0, start) + mention + text.substring(end);
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeInputValueSetter.call(textarea, newValue);
      
      textarea.selectionStart = textarea.selectionEnd = start + mention.length;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(mention);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: mention }));
    }
  },

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.styleEl) {
      this.styleEl.remove();
      this.styleEl = null;
    }
    document.querySelectorAll('.yp-quickmention-btn').forEach(b => b.remove());
  }
};

window.PluginHost.register(quickmention);
