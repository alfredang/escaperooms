/* ============================================
   Characters - AI Character Dialogue Management
   ============================================ */

export class Characters {
    constructor() {
        this.characterData = null;
    }

    async load() {
        try {
            const response = await fetch('./data/characters.json');
            this.characterData = await response.json();
        } catch (err) {
            console.warn('Failed to load character data:', err);
        }
    }

    getCharacter(id) {
        return this.characterData?.[id] || null;
    }

    getDialogue(characterId, type) {
        const char = this.getCharacter(characterId);
        if (!char?.fallbackDialogue) return '';

        const dialogue = char.fallbackDialogue[type];
        if (Array.isArray(dialogue)) {
            return dialogue[Math.floor(Math.random() * dialogue.length)];
        }
        return dialogue || '';
    }
}
