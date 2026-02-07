/* ============================================
   Debug Puzzle - Find Bugs in JavaScript Code
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class DebugPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.fixes = {};
        this.selectedLine = null;
    }

    buildPuzzle(bodyElement) {
        const { code, totalBugs } = this.config.config;

        const codeHtml = code.map(line => {
            const cls = line.hasBug ? 'code-line has-bug' : 'code-line';
            return `
                <div class="${cls}" data-line="${line.line}" ${line.hasBug ? 'data-has-bug="true"' : ''}>
                    <span class="line-number">${line.line}</span>
                    <span class="line-content">${this._syntaxHighlight(line.text)}</span>
                </div>
            `;
        }).join('');

        bodyElement.innerHTML = `
            <div class="debug-workspace">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-md);">
                    <span class="text-muted" style="font-size: var(--font-size-xs);">Click on buggy lines to fix them</span>
                    <span class="badge badge-accent" id="bugs-found">0/${totalBugs} bugs fixed</span>
                </div>
                <div class="code-display">${codeHtml}</div>
                <div id="fix-panel" class="fix-panel" style="display: none;"></div>
            </div>
        `;

        this._addStyles();

        // Click handlers for bug lines
        bodyElement.querySelectorAll('.code-line.has-bug').forEach(line => {
            line.addEventListener('click', () => {
                const lineNum = parseInt(line.dataset.line);
                this._showFixOptions(lineNum, line);
            });
        });
    }

    _showFixOptions(lineNum, lineElement) {
        const { code } = this.config.config;
        const lineData = code.find(l => l.line === lineNum);
        if (!lineData || !lineData.hasBug) return;
        if (this.fixes[`line${lineNum}`]) return; // Already fixed

        this.selectedLine = lineNum;

        // Highlight
        this.container.querySelectorAll('.code-line').forEach(l => l.classList.remove('bug-found'));
        lineElement.classList.add('bug-found');

        const panel = this.container.querySelector('#fix-panel');
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="fix-panel-content animate-slide-up">
                <p style="font-weight: 500; margin-bottom: var(--spacing-sm);">
                    Line ${lineNum}: Select the correct fix
                </p>
                <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--spacing-md);">
                    Bug type: ${lineData.bugType.replace(/-/g, ' ')}
                </p>
                <div class="fix-options">
                    ${lineData.options.map((opt, i) => `
                        <button class="fix-option" data-fix="${this._escapeAttr(opt)}" data-line="${lineNum}">
                            <code>${this._escapeHtml(opt)}</code>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        panel.querySelectorAll('.fix-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fix = e.currentTarget.dataset.fix;
                const ln = parseInt(e.currentTarget.dataset.line);
                this._applyFix(ln, fix);
            });
        });

        this.audio.play('click');
    }

    _applyFix(lineNum, fixText) {
        const { code } = this.config.config;
        const lineData = code.find(l => l.line === lineNum);
        if (!lineData) return;

        this.fixes[`line${lineNum}`] = fixText;

        // Update line display
        const lineEl = this.container.querySelector(`[data-line="${lineNum}"]`);
        if (lineEl) {
            const contentEl = lineEl.querySelector('.line-content');
            if (contentEl) {
                contentEl.innerHTML = this._syntaxHighlight(fixText);
            }

            lineEl.classList.remove('has-bug', 'bug-found');
            lineEl.classList.add(fixText === lineData.fix ? 'bug-fixed' : 'bug-found');
        }

        // Update counter
        const counter = this.container.querySelector('#bugs-found');
        if (counter) {
            counter.textContent = `${Object.keys(this.fixes).length}/${this.config.config.totalBugs} bugs fixed`;
        }

        // Hide fix panel
        const panel = this.container.querySelector('#fix-panel');
        if (panel) panel.style.display = 'none';

        this.audio.play('click');
    }

    _syntaxHighlight(text) {
        let html = this._escapeHtml(text);
        // Keywords
        html = html.replace(/\b(function|let|const|var|if|for|return|true|false|null)\b/g,
            '<span class="syntax-keyword">$1</span>');
        // Strings
        html = html.replace(/'([^']*)'/g, '<span class="syntax-string">\'$1\'</span>');
        // Operators
        html = html.replace(/(===|!==|==|!=|&gt;=|&lt;=|&amp;&amp;|\|\||&gt;|&lt;)/g,
            '<span class="syntax-operator">$1</span>');
        // Comments
        html = html.replace(/(\/\/.*)$/gm, '<span class="syntax-comment">$1</span>');
        return html;
    }

    _addStyles() {
        if (document.getElementById('debug-styles')) return;
        const style = document.createElement('style');
        style.id = 'debug-styles';
        style.textContent = `
            .debug-workspace { display: flex; flex-direction: column; gap: var(--spacing-md); }
            .code-display {
                background: #0d0208;
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                font-family: var(--font-mono);
                font-size: var(--font-size-sm);
                line-height: 1.8;
                overflow-x: auto;
            }
            .code-line {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: 2px var(--spacing-sm);
                border-radius: var(--radius-sm);
                transition: background var(--transition-fast);
                border-left: 2px solid transparent;
            }
            .code-line:hover { background: rgba(255,255,255,0.02); }
            .code-line.has-bug { cursor: pointer; }
            .code-line.has-bug:hover { background: rgba(var(--room-accent-rgb), 0.08); }
            .code-line.bug-found { background: rgba(var(--room-accent-rgb), 0.08); border-left-color: var(--color-error); }
            .code-line.bug-fixed { background: rgba(16, 185, 129, 0.06); border-left-color: var(--color-success); }
            .line-number { color: rgba(var(--room-accent-rgb), 0.3); min-width: 24px; text-align: right; user-select: none; }
            .line-content { flex: 1; }
            .syntax-keyword { color: #ef4444; }
            .syntax-string { color: #f59e0b; }
            .syntax-operator { color: #8b5cf6; }
            .syntax-comment { color: #6b7280; font-style: italic; }
            .fix-panel {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
            }
            .fix-options { display: flex; flex-direction: column; gap: var(--spacing-sm); }
            .fix-option {
                display: block;
                width: 100%;
                text-align: left;
                padding: var(--spacing-md);
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                color: var(--color-text-primary);
                cursor: pointer;
                transition: all var(--transition-fast);
                font-family: var(--font-mono);
                font-size: var(--font-size-sm);
            }
            .fix-option:hover {
                border-color: rgba(var(--room-accent-rgb), 0.5);
                background: rgba(var(--room-accent-rgb), 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.fixes;
    }

    checkAnswer(userAnswer) {
        const { code } = this.config.config;
        let allCorrect = true;

        code.filter(l => l.hasBug).forEach(line => {
            const key = `line${line.line}`;
            const isCorrect = userAnswer[key] === line.fix;

            const lineEl = this.container.querySelector(`[data-line="${line.line}"]`);
            if (lineEl) {
                lineEl.classList.remove('bug-fixed', 'bug-found');
                lineEl.classList.add(isCorrect ? 'bug-fixed' : 'bug-found');
            }

            if (!isCorrect) allCorrect = false;
        });

        return allCorrect;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _escapeAttr(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
}
