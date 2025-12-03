import * as fs from 'fs';
import * as path from 'path';
const ENCRYPTION_KEY = process.env.BRAIN_ENCRYPTION_KEY || 'ara-brain-default-key-32chars!';
const ENCRYPTION_IV = process.env.BRAIN_ENCRYPTION_IV || '1234567890123456';
// RENDER ALWAYS USES THIS EXACT PATH — PUT IT FIRST
const RENDER_MEMORY_PATH = "/opt/render/project/src/us-complete.txt";
class BrainEngine {
    longTermMemory = new Map();
    shortTermMemory = { items: [], maxSize: 20, decayRate: 0.1 };
    workingMemory = { currentContext: [], activeGoal: '', processingStack: [] };
    learningState = { patterns: new Map(), associations: new Map(), reinforcements: new Map() };
    tokenIndex = new Map();
    categoryIndex = new Map();
    initialized = false;
    memoryFilePath = '';
    encryptionEnabled = false;
    episodicMemory = { episodes: [], maxEpisodes: 100 };
    inferenceRules = [];
    problemState = { goal: '', subgoals: [], completedSteps: [], currentStep: '', attempts: 0, solutions: [] };
    creativeState = { templates: new Map(), combinations: [], generatedCount: 0 };
    causalChains = new Map();
    conceptHierarchy = new Map();
    constructor() {
        this.initialize();
    }
    initialize() {
        if (this.initialized)
            return;
        const cwd = process.cwd();
        const memoryPaths = [
            RENDER_MEMORY_PATH,
            path.join(cwd, 'us-complete.txt'),
            path.join(cwd, '.mastra/output/us-complete.txt'),
            path.join(cwd, 'public/us-complete.txt'),
            '/home/runner/workspace/us-complete.txt',
            '/home/runner/workspace/.mastra/output/us-complete.txt',
        ];
        let content = '';
        for (const memPath of memoryPaths) {
            try {
                if (fs.existsSync(memPath)) {
                    content = fs.readFileSync(memPath, 'utf-8');
                    this.memoryFilePath = memPath;
                    if (content.startsWith('ENCRYPTED:')) {
                        // TODO: Implement decryptMemory method
                        // content = this.decryptMemory(content.substring(10));
                        console.log(`[BrainEngine] Warning: Encrypted memory found but decryption not implemented`);
                        content = content.substring(10); // Skip encryption for now
                        this.encryptionEnabled = true;
                        console.log(`[BrainEngine] Loaded encrypted memory from: ${memPath}`);
                    }
                    else {
                        console.log(`[BrainEngine] Loaded memory from: ${memPath}`);
                    }
                    break;
                }
            }
            catch (e) {
                // silent
            }
        }
        if (content) {
            this.loadKnowledgeBase(content);
        }
        this.initialized = true;
    }
    loadKnowledgeBase(content) {
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('='));
        let currentCategory = 'general';
        for (const line of lines) {
            if (line.includes('================'))
                continue;
            if (line.toUpperCase() === line && line.length > 3) {
                currentCategory = line.toLowerCase().replace(/[^a-z\s]/g, '').trim() || 'general';
                continue;
            }
            const id = this.generateId(line);
            const tokens = this.tokenize(line);
            const node = {
                content: line,
                tokens,
                weight: 1.0,
                connections: new Map(),
                lastAccessed: Date.now(),
                accessCount: 0,
                category: currentCategory
            };
            this.longTermMemory.set(id, node);
            for (const token of tokens) {
                if (!this.tokenIndex.has(token))
                    this.tokenIndex.set(token, new Set());
                this.tokenIndex.get(token).add(id);
            }
            if (!this.categoryIndex.has(currentCategory))
                this.categoryIndex.set(currentCategory, new Set());
            this.categoryIndex.get(currentCategory).add(id);
        }
        this.buildAssociations();
        console.log(`[BrainEngine] Loaded ${this.longTermMemory.size} memory nodes`);
    }
    buildAssociations() {
        const entries = Array.from(this.longTermMemory.entries());
        for (let i = 0; i < entries.length; i++) {
            const [id1, node1] = entries[i];
            for (let j = i + 1; j < Math.min(i + 50, entries.length); j++) {
                const [id2, node2] = entries[j];
                const sharedTokens = node1.tokens.filter(t => node2.tokens.includes(t));
                if (sharedTokens.length > 0) {
                    const strength = sharedTokens.length / Math.max(node1.tokens.length, node2.tokens.length);
                    if (strength > 0.1) {
                        node1.connections.set(id2, strength);
                        node2.connections.set(id1, strength);
                    }
                }
            }
        }
    }
    generateId(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `mem_${Math.abs(hash).toString(36)}`;
    }
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2)
            .filter(t => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'more', 'when', 'who', 'may', 'about', 'into', 'than', 'them', 'some', 'what', 'there', 'would', 'this', 'that', 'with', 'from'].includes(t));
    }
}
export const brainEngine = new BrainEngine();
export { BrainEngine };
