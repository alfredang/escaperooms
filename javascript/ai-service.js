/* ============================================
   AIService - Dual Provider AI with Fallback
   ============================================ */

export class AIService {
    constructor(gameState) {
        this.state = gameState;
        this.apiKey = null;
        this.provider = null;
        this.baseURL = null;
        this.model = null;
        this.enabled = false;
        this.lastCallTime = 0;
        this.rateLimitMs = 5000;
    }

    configure(apiKey, provider = 'openai') {
        this.apiKey = apiKey;
        this.provider = provider;

        if (provider === 'openai') {
            this.baseURL = 'https://api.openai.com/v1/chat/completions';
            this.model = 'gpt-4o-mini';
        } else if (provider === 'anthropic') {
            this.baseURL = 'https://api.anthropic.com/v1/messages';
            this.model = 'claude-sonnet-4-20250514';
        }

        this.enabled = true;

        // Store key in sessionStorage only
        sessionStorage.setItem('aivault_provider', provider);
        // Note: API key intentionally NOT stored persistently
    }

    isEnabled() {
        return this.enabled && this.apiKey;
    }

    async getHint(puzzleContext, hintLevel, character) {
        if (!this.isEnabled()) {
            return this._getFallbackHint(puzzleContext, hintLevel);
        }

        // Rate limiting
        const now = Date.now();
        if (now - this.lastCallTime < this.rateLimitMs) {
            return this._getFallbackHint(puzzleContext, hintLevel);
        }
        this.lastCallTime = now;

        const systemPrompt = this._buildCharacterPrompt(character);
        const userPrompt = this._buildHintPrompt(puzzleContext, hintLevel);

        try {
            const response = await this._callAPI(systemPrompt, userPrompt);
            return { source: 'ai', text: response };
        } catch (err) {
            console.warn('AI API failed, using fallback:', err);
            return this._getFallbackHint(puzzleContext, hintLevel);
        }
    }

    async evaluatePrompt(userPrompt, goalDescription) {
        if (!this.isEnabled()) {
            return this._simulatePromptResponse(userPrompt, goalDescription);
        }

        try {
            const aiResponse = await this._callAPI(
                'You are a helpful AI assistant. Respond naturally to the user prompt.',
                userPrompt
            );

            const evalPrompt = `Goal: "${goalDescription}"
AI Response: "${aiResponse}"
Does the response meet the goal? Reply with ONLY valid JSON: {"meets_goal": true/false, "feedback": "brief explanation"}`;

            const evalResponse = await this._callAPI(
                'You evaluate AI responses. Reply only with valid JSON.',
                evalPrompt
            );

            let evaluation;
            try {
                evaluation = JSON.parse(evalResponse);
            } catch {
                evaluation = { meets_goal: false, feedback: 'Could not evaluate response.' };
            }

            return { aiResponse, evaluation };
        } catch (err) {
            console.warn('Prompt evaluation failed:', err);
            return this._simulatePromptResponse(userPrompt, goalDescription);
        }
    }

    _getFallbackHint(puzzleContext, hintLevel) {
        const hints = puzzleContext.hints || [];
        const hint = hints.find(h => h.level === hintLevel) || hints[hints.length - 1];
        return {
            source: 'fallback',
            text: hint?.text || 'Think carefully about the problem and try a different approach.'
        };
    }

    _buildCharacterPrompt(character) {
        const prompts = {
            mentor: `You are ARIA, a virtual mentor in an AI education escape room. You are encouraging and use the Socratic method. Never give direct answers — ask guiding questions instead. Keep responses under 2 sentences. Speak warmly but professionally.`,
            admin: `You are SYS-OP, a system administrator in an AI education escape room. You are terse, technical, and slightly impatient but ultimately helpful. Give hints using technical jargon but make them useful. Keep responses under 2 sentences.`,
            rogue: `You are ECHO, a rogue AI in an AI education escape room. You are cryptic and playful. Give hints as riddles or metaphors. Never be straightforward. Keep responses under 2 sentences.`
        };
        return prompts[character] || prompts.mentor;
    }

    _buildHintPrompt(puzzleContext, hintLevel) {
        return `The player is stuck on a puzzle called "${puzzleContext.title}".
Description: ${puzzleContext.description}
Difficulty: ${puzzleContext.difficulty}/3
Hint level: ${hintLevel}/3 (1=vague nudge, 2=moderate guidance, 3=strong hint but NOT the answer)
Attempts so far: ${puzzleContext.attempts || 0}
Provide a hint appropriate to the level. Do NOT reveal the answer. Encourage reflection and learning.`;
    }

    async _callAPI(systemPrompt, userPrompt) {
        const headers = { 'Content-Type': 'application/json' };
        let body;

        if (this.provider === 'openai') {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
            body = JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 150,
                temperature: 0.7
            });
        } else if (this.provider === 'anthropic') {
            headers['x-api-key'] = this.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-direct-browser-access'] = 'true';
            body = JSON.stringify({
                model: this.model,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                max_tokens: 150
            });
        }

        const response = await fetch(this.baseURL, { method: 'POST', headers, body });
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (this.provider === 'openai') return data.choices[0].message.content;
        if (this.provider === 'anthropic') return data.content[0].text;
    }

    _simulatePromptResponse(userPrompt, goalDescription) {
        const prompt = userPrompt.toLowerCase();
        let meets_goal = false;
        let feedback = 'Try to be more specific in your prompt.';

        // Basic keyword matching for offline play
        if (goalDescription.includes('haiku') && goalDescription.includes('cybersecurity')) {
            const hasFormat = prompt.includes('haiku');
            const hasTopic = prompt.includes('cyber') || prompt.includes('security');
            const hasConstraint = prompt.includes('only') || prompt.includes('just') || prompt.includes('nothing else');

            if (hasFormat && hasTopic && hasConstraint) {
                meets_goal = true;
                feedback = 'Great prompt! You specified the format, topic, and output constraint.';
            } else if (hasFormat && hasTopic) {
                feedback = 'Good start! Try adding a constraint to ensure ONLY a haiku is returned.';
            } else if (hasFormat) {
                feedback = 'You mentioned the format but forgot the topic.';
            } else {
                feedback = 'Think about what format and topic the output should have.';
            }
        }

        const aiResponse = meets_goal
            ? 'Firewalls standing tall\nEncrypted data flows safe\nHackers find no way'
            : 'Here is some information about cybersecurity: Cybersecurity involves protecting systems, networks, and programs from digital attacks...';

        return {
            aiResponse,
            evaluation: { meets_goal, feedback }
        };
    }
}
