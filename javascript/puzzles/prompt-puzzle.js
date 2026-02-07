/* ============================================
   Prompt Puzzle - Prompt Engineering Mini-Game
   ============================================ */

import BasePuzzle from './base-puzzle.js';

export default class PromptPuzzle extends BasePuzzle {
    constructor(config, gameState, audioManager) {
        super(config, gameState, audioManager);
        this.userPrompt = '';
        this.attemptCount = 0;
        this.maxAttempts = config.config.maxAttempts || 3;
        this.aiService = null;
    }

    buildPuzzle(bodyElement) {
        const { goal, evaluationCriteria } = this.config.config;

        const criteriaHtml = evaluationCriteria.map(c =>
            `<li>${c}</li>`
        ).join('');

        bodyElement.innerHTML = `
            <div class="prompt-workspace">
                <div class="prompt-goal">
                    <h4 style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);">Your Goal</h4>
                    <p style="color: var(--room-accent); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed);">
                        ${goal}
                    </p>
                    <div style="margin-top: var(--spacing-sm);">
                        <p class="text-muted" style="font-size: var(--font-size-xs); margin-bottom: var(--spacing-xs);">Success criteria:</p>
                        <ul style="list-style: disc; padding-left: var(--spacing-lg); font-size: var(--font-size-xs); color: var(--color-text-muted);">
                            ${criteriaHtml}
                        </ul>
                    </div>
                </div>

                <div class="chat-container" id="chat-log">
                    <div class="chat-placeholder text-muted" style="text-align: center; padding: var(--spacing-xl); font-size: var(--font-size-sm);">
                        Write your prompt below and send it to the AI
                    </div>
                </div>

                <div class="prompt-input-area">
                    <textarea class="prompt-input" id="prompt-textarea"
                        placeholder="Write your prompt here..."
                        rows="3"></textarea>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-sm);">
                        <span class="text-muted" style="font-size: var(--font-size-xs);">
                            Attempts: <span id="prompt-attempts">${this.attemptCount}</span>/${this.maxAttempts}
                        </span>
                        <button class="btn btn-primary btn-sm" id="btn-send-prompt">Send Prompt</button>
                    </div>
                </div>

                <div id="prompt-feedback-area" style="display: none;"></div>
            </div>
        `;

        this._addStyles();

        // Get AI service reference from global app
        this.aiService = window.app?.ai || null;

        const sendBtn = bodyElement.querySelector('#btn-send-prompt');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this._sendPrompt());
        }

        const textarea = bodyElement.querySelector('#prompt-textarea');
        if (textarea) {
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._sendPrompt();
                }
            });
        }
    }

    async _sendPrompt() {
        if (this.solved) return;
        if (this.attemptCount >= this.maxAttempts) {
            this._showPromptFeedback('No attempts remaining!', false);
            return;
        }

        const textarea = this.container.querySelector('#prompt-textarea');
        const prompt = textarea?.value?.trim();
        if (!prompt) return;

        this.userPrompt = prompt;
        this.attemptCount++;
        this.attempts = this.attemptCount;

        // Update counter
        const counter = this.container.querySelector('#prompt-attempts');
        if (counter) counter.textContent = this.attemptCount;

        // Add user message to chat
        this._addChatMessage(prompt, 'user');
        if (textarea) textarea.value = '';

        // Show loading
        this._addChatMessage('Thinking...', 'ai loading');

        // Evaluate
        let result;
        if (this.aiService?.isEnabled()) {
            result = await this.aiService.evaluatePrompt(prompt, this.config.config.goal);
        } else {
            result = this.aiService?._simulatePromptResponse(prompt, this.config.config.goal) ||
                     this._localSimulate(prompt);
        }

        // Remove loading message
        const loadingMsg = this.container.querySelector('.chat-message.loading');
        if (loadingMsg) loadingMsg.remove();

        // Add AI response
        this._addChatMessage(result.aiResponse, 'ai');

        // Show evaluation feedback
        const feedbackArea = this.container.querySelector('#prompt-feedback-area');
        if (feedbackArea) {
            feedbackArea.style.display = 'block';
            feedbackArea.innerHTML = `
                <div class="prompt-eval ${result.evaluation.meets_goal ? 'success' : 'partial'}" style="animation: fadeSlideUp var(--transition-normal) forwards;">
                    <p style="font-weight: 500; margin-bottom: var(--spacing-xs);">
                        ${result.evaluation.meets_goal ? '✓ Goal met!' : '✗ Not quite'}
                    </p>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">
                        ${result.evaluation.feedback}
                    </p>
                </div>
            `;
        }

        if (result.evaluation.meets_goal) {
            this.solved = true;
            this.onSuccess();
        } else if (this.attemptCount >= this.maxAttempts) {
            this.onFailure();
        }

        this.audio.play(result.evaluation.meets_goal ? 'success' : 'click');
    }

    _localSimulate(prompt) {
        const p = prompt.toLowerCase();
        const { simulatedKeywords } = this.config.config;

        const hasFormat = simulatedKeywords.format.some(k => p.includes(k));
        const hasTopic = simulatedKeywords.topic.some(k => p.includes(k));
        const hasConstraint = simulatedKeywords.constraint.some(k => p.includes(k));

        let meets_goal = hasFormat && hasTopic && hasConstraint;
        let feedback;

        if (meets_goal) {
            feedback = 'Great prompt! You specified format, topic, and output constraints clearly.';
        } else if (hasFormat && hasTopic) {
            feedback = 'Good — you have format and topic. Add a constraint to ensure only the haiku is returned.';
        } else if (hasFormat) {
            feedback = 'You specified the format but need to include the topic (cybersecurity).';
        } else if (hasTopic) {
            feedback = 'Topic mentioned but you need to specify the output format (haiku).';
        } else {
            feedback = 'Be more specific: mention the format (haiku), topic (cybersecurity), and add constraints.';
        }

        const aiResponse = meets_goal
            ? 'Firewalls standing tall\nEncrypted data flows safe\nHackers find no way'
            : 'Here is some information about cybersecurity...\n\nCybersecurity involves protecting computer systems and networks from unauthorized access, damage, or theft. Key areas include:\n- Network security\n- Application security\n- Information security';

        return { aiResponse, evaluation: { meets_goal, feedback } };
    }

    _addChatMessage(text, type) {
        const chatLog = this.container.querySelector('#chat-log');
        if (!chatLog) return;

        // Remove placeholder
        const placeholder = chatLog.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();

        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        msg.textContent = text;
        msg.style.whiteSpace = 'pre-wrap';
        chatLog.appendChild(msg);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    _showPromptFeedback(text, success) {
        const area = this.container.querySelector('#prompt-feedback-area');
        if (area) {
            area.style.display = 'block';
            area.innerHTML = `<div class="prompt-eval ${success ? 'success' : 'error'}">${text}</div>`;
        }
    }

    _addStyles() {
        if (document.getElementById('prompt-styles')) return;
        const style = document.createElement('style');
        style.id = 'prompt-styles';
        style.textContent = `
            .prompt-workspace { display: flex; flex-direction: column; gap: var(--spacing-lg); }
            .prompt-goal {
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.15);
                border-radius: var(--radius-md);
                padding: var(--spacing-lg);
            }
            .chat-container {
                background: #0d0208;
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                min-height: 150px;
                max-height: 300px;
                overflow-y: auto;
            }
            .chat-message {
                margin-bottom: var(--spacing-md);
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: var(--radius-md);
                font-size: var(--font-size-sm);
                animation: fadeSlideUp 0.2s ease;
            }
            .chat-message.user {
                background: rgba(var(--room-accent-rgb), 0.1);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                margin-left: 20%;
            }
            .chat-message.ai {
                background: rgba(100, 100, 100, 0.1);
                border: 1px solid rgba(100, 100, 100, 0.2);
                margin-right: 20%;
            }
            .chat-message.loading { opacity: 0.5; animation: pulse 1s ease-in-out infinite; }
            .prompt-input {
                width: 100%;
                min-height: 60px;
                resize: vertical;
                font-family: var(--font-mono);
                font-size: var(--font-size-sm);
                background: rgba(var(--room-accent-rgb), 0.05);
                border: 1px solid rgba(var(--room-accent-rgb), 0.2);
                color: var(--color-text-primary);
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
            }
            .prompt-input:focus {
                border-color: rgba(var(--room-accent-rgb), 0.5);
                box-shadow: 0 0 10px rgba(var(--room-accent-rgb), 0.15);
                outline: none;
            }
            .prompt-eval {
                padding: var(--spacing-md);
                border-radius: var(--radius-md);
            }
            .prompt-eval.success {
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: var(--color-success);
            }
            .prompt-eval.partial {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                color: var(--color-warning);
            }
            .prompt-eval.error {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: var(--color-error);
            }
        `;
        document.head.appendChild(style);
    }

    getUserAnswer() {
        return this.userPrompt;
    }

    // Override submit — handled by _sendPrompt
    submit() {
        // No-op; submission is handled via the send button
    }

    render(parentElement) {
        this.container = document.createElement('div');
        this.container.className = 'puzzle-container animate-slide-up';
        this.container.innerHTML = `
            <div class="puzzle-header">
                <h3 class="puzzle-title">${this.config.title}</h3>
                <p class="puzzle-description">${this.config.description}</p>
            </div>
            <div class="puzzle-body" id="puzzle-body-${this.config.id}"></div>
            <div class="puzzle-feedback" id="puzzle-feedback-${this.config.id}"></div>
            <div class="puzzle-footer">
                <div class="puzzle-info">
                    <span class="badge badge-accent">Difficulty: ${'★'.repeat(this.config.difficulty)}${'☆'.repeat(3 - this.config.difficulty)}</span>
                    <span class="text-muted" style="font-size: var(--font-size-xs);">${this.config.points} pts</span>
                </div>
            </div>
        `;

        parentElement.appendChild(this.container);
        this.buildPuzzle(this.container.querySelector(`#puzzle-body-${this.config.id}`));
    }
}
