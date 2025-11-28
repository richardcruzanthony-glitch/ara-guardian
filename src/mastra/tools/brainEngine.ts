import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.BRAIN_ENCRYPTION_KEY || 'ara-brain-default-key-32chars!';
const ENCRYPTION_IV = process.env.BRAIN_ENCRYPTION_IV || '1234567890123456';

interface MemoryNode {
  content: string;
  tokens: string[];
  weight: number;
  connections: Map<string, number>;
  lastAccessed: number;
  accessCount: number;
  category: string;
}

interface ShortTermMemory {
  items: string[];
  maxSize: number;
  decayRate: number;
}

interface WorkingMemory {
  currentContext: string[];
  activeGoal: string;
  processingStack: string[];
}

interface LearningState {
  patterns: Map<string, number>;
  associations: Map<string, string[]>;
  reinforcements: Map<string, number>;
}

class BrainEngine {
  private longTermMemory: Map<string, MemoryNode> = new Map();
  private shortTermMemory: ShortTermMemory = { items: [], maxSize: 20, decayRate: 0.1 };
  private workingMemory: WorkingMemory = { currentContext: [], activeGoal: '', processingStack: [] };
  private learningState: LearningState = { patterns: new Map(), associations: new Map(), reinforcements: new Map() };
  private tokenIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private initialized: boolean = false;
  private memoryFilePath: string = '';
  private encryptionEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;
    
    const cwd = process.cwd();
    const memoryPaths = [
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
            content = this.decryptMemory(content.substring(10));
            this.encryptionEnabled = true;
            console.log(`🔐 [BrainEngine] Loaded encrypted memory from: ${memPath}`);
          } else {
            console.log(`🧠 [BrainEngine] Loaded memory from: ${memPath}`);
          }
          break;
        }
      } catch (e) {}
    }

    if (content) {
      this.loadKnowledgeBase(content);
    }
    
    this.initialized = true;
  }

  private loadKnowledgeBase(content: string) {
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('='));
    let currentCategory = 'general';

    for (const line of lines) {
      if (line.includes('================')) continue;
      
      if (line.toUpperCase() === line && line.length > 3) {
        currentCategory = line.toLowerCase().replace(/[^a-z\s]/g, '').trim() || 'general';
        continue;
      }

      const id = this.generateId(line);
      const tokens = this.tokenize(line);
      
      const node: MemoryNode = {
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
        if (!this.tokenIndex.has(token)) {
          this.tokenIndex.set(token, new Set());
        }
        this.tokenIndex.get(token)!.add(id);
      }

      if (!this.categoryIndex.has(currentCategory)) {
        this.categoryIndex.set(currentCategory, new Set());
      }
      this.categoryIndex.get(currentCategory)!.add(id);
    }

    this.buildAssociations();
    console.log(`🧠 [BrainEngine] Loaded ${this.longTermMemory.size} memory nodes`);
  }

  private buildAssociations() {
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

  private generateId(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `mem_${Math.abs(hash).toString(36)}`;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
      .filter(t => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'more', 'when', 'who', 'may', 'about', 'into', 'than', 'them', 'some', 'what', 'there', 'would', 'this', 'that', 'with', 'from'].includes(t));
  }

  perceive(input: string): { tokens: string[]; intent: string; entities: string[] } {
    const tokens = this.tokenize(input);
    
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    const commandWords = ['show', 'tell', 'find', 'get', 'search', 'list', 'explain'];
    const memoryWords = ['remember', 'recall', 'said', 'earlier', 'before', 'history'];
    
    let intent = 'statement';
    if (input.includes('?') || questionWords.some(w => input.toLowerCase().startsWith(w))) {
      intent = 'question';
    } else if (commandWords.some(w => input.toLowerCase().includes(w))) {
      intent = 'command';
    } else if (memoryWords.some(w => input.toLowerCase().includes(w))) {
      intent = 'recall';
    }

    const entities: string[] = [];
    const entityPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
      /\b\d+(?:\.\d+)?(?:\s*(?:percent|%|dollars?|hours?|minutes?|seconds?|days?|weeks?|months?|years?))?\b/gi,
    ];
    
    for (const pattern of entityPatterns) {
      const matches = input.match(pattern);
      if (matches) entities.push(...matches);
    }

    this.shortTermMemory.items.unshift(input);
    if (this.shortTermMemory.items.length > this.shortTermMemory.maxSize) {
      this.shortTermMemory.items.pop();
    }

    this.workingMemory.currentContext = tokens.slice(0, 10);

    return { tokens, intent, entities };
  }

  recall(query: string, limit: number = 10): MemoryNode[] {
    const queryTokens = this.tokenize(query);
    const candidates: Map<string, number> = new Map();

    for (const token of queryTokens) {
      const nodeIds = this.tokenIndex.get(token);
      if (nodeIds) {
        for (const id of nodeIds) {
          const current = candidates.get(id) || 0;
          candidates.set(id, current + 1);
        }
      }
    }

    const scored: Array<{ id: string; score: number }> = [];
    
    for (const [id, matchCount] of candidates) {
      const node = this.longTermMemory.get(id);
      if (!node) continue;

      let score = matchCount / queryTokens.length;
      score *= node.weight;
      score *= (1 + Math.log(node.accessCount + 1) * 0.1);
      
      const recency = (Date.now() - node.lastAccessed) / (1000 * 60 * 60 * 24);
      score *= Math.exp(-recency * 0.01);

      scored.push({ id, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const results: MemoryNode[] = [];
    for (const { id } of scored.slice(0, limit)) {
      const node = this.longTermMemory.get(id);
      if (node) {
        node.lastAccessed = Date.now();
        node.accessCount++;
        results.push(node);
      }
    }

    return results;
  }

  reason(input: string, memories: MemoryNode[]): { response: string; confidence: number; reasoning: string[] } {
    const perception = this.perceive(input);
    const reasoning: string[] = [];
    let response = '';
    let confidence = 0;

    reasoning.push(`Intent detected: ${perception.intent}`);
    reasoning.push(`Key tokens: ${perception.tokens.slice(0, 5).join(', ')}`);

    if (memories.length === 0) {
      reasoning.push('No matching memories found');
      return {
        response: "I don't have information about that in my memory yet.",
        confidence: 0.1,
        reasoning
      };
    }

    const bestMatch = memories[0];
    reasoning.push(`Best match: "${bestMatch.content.substring(0, 50)}..."`);
    reasoning.push(`Match weight: ${bestMatch.weight.toFixed(2)}`);

    if (perception.intent === 'question') {
      const relatedNodes = this.getConnectedNodes(bestMatch, 3);
      if (relatedNodes.length > 0) {
        reasoning.push(`Found ${relatedNodes.length} related concepts`);
        response = bestMatch.content;
        if (relatedNodes.length > 0 && relatedNodes[0].content !== bestMatch.content) {
          response += ` Related: ${relatedNodes[0].content}`;
        }
      } else {
        response = bestMatch.content;
      }
      confidence = Math.min(0.9, memories[0].weight * 0.7 + 0.2);
    } else if (perception.intent === 'recall') {
      const recentItems = this.shortTermMemory.items.slice(0, 5);
      response = `Recent context: ${recentItems.join(' | ')}`;
      confidence = 0.8;
    } else {
      response = bestMatch.content;
      confidence = Math.min(0.85, memories[0].weight * 0.6 + 0.25);
    }

    return { response, confidence, reasoning };
  }

  private getConnectedNodes(node: MemoryNode, limit: number): MemoryNode[] {
    const connected: MemoryNode[] = [];
    const sortedConnections = Array.from(node.connections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    for (const [id] of sortedConnections) {
      const connectedNode = this.longTermMemory.get(id);
      if (connectedNode) {
        connected.push(connectedNode);
      }
    }

    return connected;
  }

  learn(input: string, feedback: 'positive' | 'negative' | 'neutral') {
    const tokens = this.tokenize(input);
    
    for (const token of tokens) {
      const nodeIds = this.tokenIndex.get(token);
      if (nodeIds) {
        for (const id of nodeIds) {
          const node = this.longTermMemory.get(id);
          if (node) {
            if (feedback === 'positive') {
              node.weight = Math.min(2.0, node.weight * 1.1);
            } else if (feedback === 'negative') {
              node.weight = Math.max(0.1, node.weight * 0.9);
            }
          }
        }
      }
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `${tokens[i]}_${tokens[i + 1]}`;
      const count = this.learningState.patterns.get(pair) || 0;
      this.learningState.patterns.set(pair, count + 1);
    }

    const recentContext = this.workingMemory.currentContext;
    for (const contextToken of recentContext) {
      for (const inputToken of tokens) {
        if (contextToken !== inputToken) {
          const existing = this.learningState.associations.get(contextToken) || [];
          if (!existing.includes(inputToken)) {
            existing.push(inputToken);
            this.learningState.associations.set(contextToken, existing.slice(-20));
          }
        }
      }
    }
  }

  process(input: string): { response: string; confidence: number; memoryHits: number; reasoning: string[] } {
    const perception = this.perceive(input);
    const memories = this.recall(input, 10);
    const { response, confidence, reasoning } = this.reason(input, memories);

    this.learn(input, confidence > 0.5 ? 'positive' : 'neutral');

    return {
      response,
      confidence,
      memoryHits: memories.length,
      reasoning
    };
  }

  getStats(): { 
    longTermSize: number; 
    shortTermSize: number; 
    tokenCount: number; 
    categoryCount: number;
    patternCount: number;
    associationCount: number;
  } {
    return {
      longTermSize: this.longTermMemory.size,
      shortTermSize: this.shortTermMemory.items.length,
      tokenCount: this.tokenIndex.size,
      categoryCount: this.categoryIndex.size,
      patternCount: this.learningState.patterns.size,
      associationCount: this.learningState.associations.size
    };
  }

  searchByCategory(category: string): MemoryNode[] {
    const nodeIds = this.categoryIndex.get(category.toLowerCase());
    if (!nodeIds) return [];
    
    const results: MemoryNode[] = [];
    for (const id of nodeIds) {
      const node = this.longTermMemory.get(id);
      if (node) results.push(node);
    }
    return results;
  }

  getCategories(): string[] {
    return Array.from(this.categoryIndex.keys());
  }

  private encryptMemory(content: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(ENCRYPTION_IV.substring(0, 16));
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(content, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted;
    } catch (e) {
      console.error('🔐 [BrainEngine] Encryption failed:', e);
      return content;
    }
  }

  private decryptMemory(encrypted: string): string {
    try {
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(ENCRYPTION_IV.substring(0, 16));
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error('🔐 [BrainEngine] Decryption failed:', e);
      return '';
    }
  }

  enableEncryption(): { success: boolean; message: string } {
    if (!this.memoryFilePath) {
      return { success: false, message: 'No memory file loaded' };
    }
    try {
      const content = fs.readFileSync(this.memoryFilePath, 'utf-8');
      if (content.startsWith('ENCRYPTED:')) {
        return { success: true, message: 'Memory already encrypted' };
      }
      const encrypted = 'ENCRYPTED:' + this.encryptMemory(content);
      fs.writeFileSync(this.memoryFilePath, encrypted);
      this.encryptionEnabled = true;
      console.log('🔐 [BrainEngine] Memory encrypted successfully');
      return { success: true, message: 'Memory encrypted successfully' };
    } catch (e) {
      return { success: false, message: `Encryption failed: ${e}` };
    }
  }

  disableEncryption(): { success: boolean; message: string } {
    if (!this.memoryFilePath) {
      return { success: false, message: 'No memory file loaded' };
    }
    try {
      const content = fs.readFileSync(this.memoryFilePath, 'utf-8');
      if (!content.startsWith('ENCRYPTED:')) {
        return { success: true, message: 'Memory already decrypted' };
      }
      const decrypted = this.decryptMemory(content.substring(10));
      fs.writeFileSync(this.memoryFilePath, decrypted);
      this.encryptionEnabled = false;
      console.log('🔓 [BrainEngine] Memory decrypted successfully');
      return { success: true, message: 'Memory decrypted successfully' };
    } catch (e) {
      return { success: false, message: `Decryption failed: ${e}` };
    }
  }

  saveInteraction(userInput: string, botResponse: string, category: string = 'learned'): { success: boolean; message: string; newSize: number } {
    if (!this.memoryFilePath) {
      return { success: false, message: 'No memory file path', newSize: this.longTermMemory.size };
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const userEntry = `[${timestamp}] User: ${userInput.replace(/\n/g, ' ')}`;
    const botEntry = `[${timestamp}] Ara: ${botResponse.replace(/\n/g, ' ')}`;
    
    try {
      let content = fs.readFileSync(this.memoryFilePath, 'utf-8');
      const wasEncrypted = content.startsWith('ENCRYPTED:');
      
      if (wasEncrypted) {
        content = this.decryptMemory(content.substring(10));
      }
      
      const categoryHeader = `\n================================================================================\n${category.toUpperCase()}\n================================================================================\n`;
      
      if (!content.includes(categoryHeader)) {
        content += categoryHeader;
      }
      
      content += `\n${userEntry}\n${botEntry}\n`;
      
      if (wasEncrypted || this.encryptionEnabled) {
        const encrypted = 'ENCRYPTED:' + this.encryptMemory(content);
        fs.writeFileSync(this.memoryFilePath, encrypted);
      } else {
        fs.writeFileSync(this.memoryFilePath, content);
      }
      
      const userTokens = this.tokenize(userInput);
      const userId = this.generateId(userEntry);
      const userNode: MemoryNode = {
        content: userEntry,
        tokens: userTokens,
        weight: 1.2,
        connections: new Map(),
        lastAccessed: Date.now(),
        accessCount: 1,
        category: category.toLowerCase()
      };
      this.longTermMemory.set(userId, userNode);
      
      for (const token of userTokens) {
        if (!this.tokenIndex.has(token)) {
          this.tokenIndex.set(token, new Set());
        }
        this.tokenIndex.get(token)!.add(userId);
      }
      
      const botTokens = this.tokenize(botResponse);
      const botId = this.generateId(botEntry);
      const botNode: MemoryNode = {
        content: botEntry,
        tokens: botTokens,
        weight: 1.2,
        connections: new Map(),
        lastAccessed: Date.now(),
        accessCount: 1,
        category: category.toLowerCase()
      };
      this.longTermMemory.set(botId, botNode);
      
      for (const token of botTokens) {
        if (!this.tokenIndex.has(token)) {
          this.tokenIndex.set(token, new Set());
        }
        this.tokenIndex.get(token)!.add(botId);
      }
      
      if (!this.categoryIndex.has(category.toLowerCase())) {
        this.categoryIndex.set(category.toLowerCase(), new Set());
      }
      this.categoryIndex.get(category.toLowerCase())!.add(userId);
      this.categoryIndex.get(category.toLowerCase())!.add(botId);
      
      console.log(`📝 [BrainEngine] Saved interaction to memory: ${userInput.substring(0, 30)}... (${this.longTermMemory.size} nodes)`);
      return { success: true, message: 'Interaction saved to memory', newSize: this.longTermMemory.size };
    } catch (e) {
      console.error('📝 [BrainEngine] Failed to save interaction:', e);
      return { success: false, message: `Failed to save: ${e}`, newSize: this.longTermMemory.size };
    }
  }

  isEncrypted(): boolean {
    return this.encryptionEnabled;
  }

  getMemoryPath(): string {
    return this.memoryFilePath;
  }
}

export const brainEngine = new BrainEngine();
export { BrainEngine, MemoryNode };
