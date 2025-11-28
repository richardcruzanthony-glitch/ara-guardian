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

interface EpisodicMemory {
  episodes: Array<{
    id: string;
    timestamp: number;
    context: string[];
    input: string;
    output: string;
    outcome: 'success' | 'failure' | 'neutral';
  }>;
  maxEpisodes: number;
}

interface InferenceRule {
  if: string[];
  then: string;
  confidence: number;
  uses: number;
}

interface ProblemState {
  goal: string;
  subgoals: string[];
  completedSteps: string[];
  currentStep: string;
  attempts: number;
  solutions: string[];
}

interface CreativeState {
  templates: Map<string, string>;
  combinations: Array<{ a: string; b: string; result: string }>;
  generatedCount: number;
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
  
  private episodicMemory: EpisodicMemory = { episodes: [], maxEpisodes: 100 };
  private inferenceRules: InferenceRule[] = [];
  private problemState: ProblemState = { goal: '', subgoals: [], completedSteps: [], currentStep: '', attempts: 0, solutions: [] };
  private creativeState: CreativeState = { templates: new Map(), combinations: [], generatedCount: 0 };
  private causalChains: Map<string, string[]> = new Map();
  private conceptHierarchy: Map<string, { parent: string; children: string[] }> = new Map();

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

  // ============================================================================
  // REASONING MODULE - Logical inference, cause-effect chains, deduction
  // ============================================================================

  infer(premise: string): { conclusions: string[]; confidence: number; chain: string[] } {
    const tokens = this.tokenize(premise);
    const conclusions: string[] = [];
    const chain: string[] = [`Premise: ${premise}`];
    let confidence = 0;

    // Check existing inference rules
    for (const rule of this.inferenceRules) {
      const matchCount = rule.if.filter(cond => tokens.some(t => cond.includes(t))).length;
      if (matchCount >= rule.if.length * 0.7) {
        conclusions.push(rule.then);
        chain.push(`Rule applied: IF [${rule.if.join(', ')}] THEN [${rule.then}]`);
        confidence = Math.max(confidence, rule.confidence);
        rule.uses++;
      }
    }

    // Check causal chains
    for (const token of tokens) {
      const effects = this.causalChains.get(token);
      if (effects) {
        for (const effect of effects) {
          conclusions.push(`${token} leads to ${effect}`);
          chain.push(`Causal: ${token} → ${effect}`);
          confidence = Math.max(confidence, 0.7);
        }
      }
    }

    // Memory-based inference - find related concepts
    const memories = this.recall(premise, 5);
    for (const mem of memories) {
      if (mem.content.includes('because') || mem.content.includes('therefore') || mem.content.includes('causes')) {
        conclusions.push(mem.content);
        chain.push(`Memory inference: ${mem.content.substring(0, 50)}...`);
        confidence = Math.max(confidence, 0.6);
      }
    }

    // Pattern-based deduction
    for (let i = 0; i < tokens.length - 1; i++) {
      const pair = `${tokens[i]}_${tokens[i + 1]}`;
      const patternCount = this.learningState.patterns.get(pair) || 0;
      if (patternCount > 3) {
        chain.push(`Pattern detected: "${tokens[i]} ${tokens[i + 1]}" (seen ${patternCount} times)`);
        confidence = Math.max(confidence, 0.5);
      }
    }

    console.log(`🧠 [Reasoning] Inferred ${conclusions.length} conclusions from: ${premise.substring(0, 30)}...`);
    return { conclusions, confidence: confidence || 0.3, chain };
  }

  addInferenceRule(conditions: string[], conclusion: string, confidence: number = 0.8): void {
    this.inferenceRules.push({
      if: conditions,
      then: conclusion,
      confidence,
      uses: 0
    });
    console.log(`🧠 [Reasoning] Added rule: IF [${conditions.join(', ')}] THEN [${conclusion}]`);
  }

  addCausalRelation(cause: string, effect: string): void {
    const existing = this.causalChains.get(cause) || [];
    if (!existing.includes(effect)) {
      existing.push(effect);
      this.causalChains.set(cause, existing);
      console.log(`🧠 [Reasoning] Added causal relation: ${cause} → ${effect}`);
    }
  }

  deduct(facts: string[]): { conclusion: string; steps: string[]; valid: boolean } {
    const steps: string[] = [];
    let conclusion = '';
    let valid = false;

    steps.push(`Starting deduction with ${facts.length} facts`);
    
    // Look for syllogistic patterns
    const allTokens = facts.flatMap(f => this.tokenize(f));
    const tokenCounts = new Map<string, number>();
    for (const t of allTokens) {
      tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
    }

    // Find connecting terms (appear in multiple facts)
    const connectors = Array.from(tokenCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([token]) => token);

    if (connectors.length > 0) {
      steps.push(`Found connecting terms: ${connectors.join(', ')}`);
      
      // Build transitive conclusion
      const firstFact = facts[0];
      const lastFact = facts[facts.length - 1];
      const firstTokens = this.tokenize(firstFact);
      const lastTokens = this.tokenize(lastFact);
      
      const uniqueFirst = firstTokens.filter(t => !connectors.includes(t))[0];
      const uniqueLast = lastTokens.filter(t => !connectors.includes(t))[0];
      
      if (uniqueFirst && uniqueLast) {
        conclusion = `${uniqueFirst} relates to ${uniqueLast} through ${connectors[0]}`;
        valid = true;
        steps.push(`Transitive inference: ${conclusion}`);
      }
    }

    if (!valid) {
      conclusion = `No valid deduction from given facts`;
      steps.push('Insufficient connecting terms for deduction');
    }

    console.log(`🧠 [Deduction] ${valid ? 'Valid' : 'Invalid'}: ${conclusion}`);
    return { conclusion, steps, valid };
  }

  // ============================================================================
  // ENHANCED LEARNING MODULE - Pattern recognition, association building
  // ============================================================================

  learnPattern(sequence: string[]): { pattern: string; frequency: number; associations: string[] } {
    const pattern = sequence.join('_');
    const currentFreq = this.learningState.patterns.get(pattern) || 0;
    this.learningState.patterns.set(pattern, currentFreq + 1);

    // Build associations between sequence elements
    const associations: string[] = [];
    for (let i = 0; i < sequence.length; i++) {
      for (let j = i + 1; j < sequence.length; j++) {
        const existing = this.learningState.associations.get(sequence[i]) || [];
        if (!existing.includes(sequence[j])) {
          existing.push(sequence[j]);
          this.learningState.associations.set(sequence[i], existing.slice(-30));
          associations.push(`${sequence[i]} → ${sequence[j]}`);
        }
      }
    }

    console.log(`📚 [Learning] Pattern "${pattern}" frequency: ${currentFreq + 1}`);
    return { pattern, frequency: currentFreq + 1, associations };
  }

  reinforceConcept(concept: string, strength: number = 1.0): void {
    const current = this.learningState.reinforcements.get(concept) || 0;
    this.learningState.reinforcements.set(concept, current + strength);
    
    // Also boost weight of matching memory nodes
    const tokens = this.tokenize(concept);
    for (const token of tokens) {
      const nodeIds = this.tokenIndex.get(token);
      if (nodeIds) {
        for (const id of nodeIds) {
          const node = this.longTermMemory.get(id);
          if (node) {
            node.weight = Math.min(3.0, node.weight + strength * 0.1);
          }
        }
      }
    }
    console.log(`📚 [Learning] Reinforced "${concept}" to ${current + strength}`);
  }

  getAssociations(concept: string): string[] {
    return this.learningState.associations.get(concept) || [];
  }

  getPatternFrequency(pattern: string): number {
    return this.learningState.patterns.get(pattern) || 0;
  }

  // ============================================================================
  // EXPANDED MEMORY MODULE - Episodic memory, context windows
  // ============================================================================

  recordEpisode(input: string, output: string, outcome: 'success' | 'failure' | 'neutral'): void {
    const episode = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      context: [...this.workingMemory.currentContext],
      input,
      output,
      outcome
    };

    this.episodicMemory.episodes.unshift(episode);
    if (this.episodicMemory.episodes.length > this.episodicMemory.maxEpisodes) {
      this.episodicMemory.episodes.pop();
    }

    console.log(`🎬 [Episodic] Recorded episode: ${outcome} - ${input.substring(0, 30)}...`);
  }

  recallEpisodes(query: string, limit: number = 5): Array<{ input: string; output: string; outcome: string; age: string }> {
    const queryTokens = this.tokenize(query);
    
    const scored = this.episodicMemory.episodes.map(ep => {
      const inputTokens = this.tokenize(ep.input);
      const matchCount = queryTokens.filter(t => inputTokens.includes(t)).length;
      const score = matchCount / Math.max(queryTokens.length, 1);
      return { ep, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ ep }) => ({
      input: ep.input,
      output: ep.output,
      outcome: ep.outcome,
      age: this.formatAge(Date.now() - ep.timestamp)
    }));
  }

  private formatAge(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  setContext(context: string[]): void {
    this.workingMemory.currentContext = context.slice(0, 20);
    console.log(`🧠 [Context] Set: ${context.slice(0, 3).join(', ')}...`);
  }

  getContext(): string[] {
    return [...this.workingMemory.currentContext];
  }

  pushToStack(item: string): void {
    this.workingMemory.processingStack.push(item);
    if (this.workingMemory.processingStack.length > 10) {
      this.workingMemory.processingStack.shift();
    }
  }

  popFromStack(): string | undefined {
    return this.workingMemory.processingStack.pop();
  }

  // ============================================================================
  // PROBLEM SOLVING MODULE - Step decomposition, solution pathways
  // ============================================================================

  setGoal(goal: string): void {
    this.problemState.goal = goal;
    this.problemState.subgoals = [];
    this.problemState.completedSteps = [];
    this.problemState.currentStep = '';
    this.problemState.attempts = 0;
    this.problemState.solutions = [];
    
    // Auto-decompose goal into subgoals
    const tokens = this.tokenize(goal);
    if (goal.includes(' and ')) {
      this.problemState.subgoals = goal.split(' and ').map(s => s.trim());
    } else if (tokens.length > 5) {
      // Break into chunks of related concepts
      for (let i = 0; i < tokens.length; i += 3) {
        this.problemState.subgoals.push(tokens.slice(i, i + 3).join(' '));
      }
    } else {
      this.problemState.subgoals = [goal];
    }

    console.log(`🎯 [Problem] Goal set: "${goal}" with ${this.problemState.subgoals.length} subgoals`);
  }

  decompose(problem: string): { steps: string[]; approach: string } {
    const tokens = this.tokenize(problem);
    const steps: string[] = [];
    let approach = 'sequential';

    // Pattern-based decomposition
    if (problem.includes('how to')) {
      approach = 'procedural';
      steps.push('1. Identify requirements');
      steps.push('2. Gather resources');
      steps.push('3. Execute steps');
      steps.push('4. Verify result');
    } else if (problem.includes('why')) {
      approach = 'causal-analysis';
      steps.push('1. Identify the effect');
      steps.push('2. List possible causes');
      steps.push('3. Evaluate each cause');
      steps.push('4. Determine root cause');
    } else if (problem.includes('compare') || problem.includes('difference')) {
      approach = 'comparative';
      steps.push('1. Identify items to compare');
      steps.push('2. List attributes');
      steps.push('3. Compare each attribute');
      steps.push('4. Summarize differences');
    } else {
      approach = 'general';
      steps.push('1. Understand the problem');
      steps.push('2. Break into components');
      steps.push('3. Solve each component');
      steps.push('4. Combine solutions');
    }

    // Add domain-specific steps from memory
    const memories = this.recall(problem, 3);
    for (const mem of memories) {
      if (mem.content.includes('step') || mem.content.includes('first') || mem.content.includes('then')) {
        steps.push(`From memory: ${mem.content.substring(0, 50)}...`);
      }
    }

    console.log(`🔧 [Problem] Decomposed using ${approach} approach: ${steps.length} steps`);
    return { steps, approach };
  }

  solve(problem: string): { solution: string; confidence: number; method: string; steps: string[] } {
    this.problemState.attempts++;
    const { steps, approach } = this.decompose(problem);
    const solutions: string[] = [];
    let confidence = 0;

    // Try memory-based solution
    const memories = this.recall(problem, 5);
    if (memories.length > 0) {
      solutions.push(memories[0].content);
      confidence = Math.max(confidence, memories[0].weight * 0.5);
    }

    // Try inference-based solution
    const { conclusions, confidence: inferConf } = this.infer(problem);
    if (conclusions.length > 0) {
      solutions.push(...conclusions);
      confidence = Math.max(confidence, inferConf);
    }

    // Try episodic memory for similar past problems
    const episodes = this.recallEpisodes(problem, 3);
    const successfulEp = episodes.find(ep => ep.outcome === 'success');
    if (successfulEp) {
      solutions.push(`Previously successful: ${successfulEp.output}`);
      confidence = Math.max(confidence, 0.8);
    }

    // Combine best solutions
    const solution = solutions.length > 0 
      ? solutions[0]
      : `No direct solution found. Suggested approach: ${approach}`;

    this.problemState.solutions = solutions;
    this.problemState.currentStep = steps[0] || '';

    console.log(`🔧 [Problem] Solution found with ${(confidence * 100).toFixed(0)}% confidence`);
    return { solution, confidence, method: approach, steps };
  }

  markStepComplete(step: string): void {
    if (!this.problemState.completedSteps.includes(step)) {
      this.problemState.completedSteps.push(step);
      
      // Move to next subgoal
      const currentIdx = this.problemState.subgoals.indexOf(this.problemState.currentStep);
      if (currentIdx < this.problemState.subgoals.length - 1) {
        this.problemState.currentStep = this.problemState.subgoals[currentIdx + 1];
      }
      console.log(`✅ [Problem] Step completed: ${step}`);
    }
  }

  getProblemProgress(): { goal: string; completed: number; total: number; current: string } {
    return {
      goal: this.problemState.goal,
      completed: this.problemState.completedSteps.length,
      total: this.problemState.subgoals.length,
      current: this.problemState.currentStep
    };
  }

  // ============================================================================
  // CREATING MODULE - Text synthesis, knowledge combination
  // ============================================================================

  synthesize(topics: string[]): { output: string; sources: string[]; novelty: number } {
    const sources: string[] = [];
    const fragments: string[] = [];

    // Gather relevant content for each topic
    for (const topic of topics) {
      const memories = this.recall(topic, 3);
      for (const mem of memories) {
        fragments.push(mem.content);
        sources.push(mem.content.substring(0, 30) + '...');
      }
    }

    // Combine fragments using shared tokens
    let output = '';
    if (fragments.length >= 2) {
      const firstTokens = this.tokenize(fragments[0]);
      const lastTokens = this.tokenize(fragments[fragments.length - 1]);
      
      // Find connecting concepts
      const connections = firstTokens.filter(t => 
        fragments.some((f, i) => i > 0 && this.tokenize(f).includes(t))
      );

      if (connections.length > 0) {
        output = `Combining ${topics.join(' and ')}: ${fragments[0]}. `;
        output += `Connected through: ${connections.slice(0, 3).join(', ')}. `;
        output += `Leading to: ${fragments[fragments.length - 1]}`;
      } else {
        output = fragments.join('. ');
      }
    } else if (fragments.length === 1) {
      output = fragments[0];
    } else {
      output = `Created new concept combining: ${topics.join(', ')}`;
    }

    // Calculate novelty (how unique is this combination)
    const outputTokens = this.tokenize(output);
    const existingMatches = this.recall(output, 1);
    const novelty = existingMatches.length > 0 
      ? 1 - (existingMatches[0].weight / 2)
      : 0.9;

    this.creativeState.generatedCount++;
    this.creativeState.combinations.push({
      a: topics[0] || '',
      b: topics[1] || '',
      result: output.substring(0, 100)
    });

    console.log(`✨ [Create] Synthesized from ${topics.length} topics, novelty: ${(novelty * 100).toFixed(0)}%`);
    return { output, sources, novelty };
  }

  generate(prompt: string, style: 'factual' | 'creative' | 'analytical' = 'factual'): { text: string; confidence: number } {
    const memories = this.recall(prompt, 5);
    const promptTokens = this.tokenize(prompt);
    let text = '';
    let confidence = 0;

    if (style === 'factual') {
      // Stick close to memory
      if (memories.length > 0) {
        text = memories.map(m => m.content).join('. ');
        confidence = 0.8;
      } else {
        text = `No factual information found for: ${prompt}`;
        confidence = 0.2;
      }
    } else if (style === 'creative') {
      // Combine and remix
      const { output, novelty } = this.synthesize(promptTokens.slice(0, 3));
      text = output;
      confidence = novelty;
    } else if (style === 'analytical') {
      // Use reasoning
      const { conclusions, chain } = this.infer(prompt);
      text = conclusions.length > 0 
        ? `Analysis: ${conclusions.join('. ')}. Reasoning: ${chain.slice(-2).join(' → ')}`
        : `Unable to analyze: ${prompt}. Insufficient data.`;
      confidence = conclusions.length > 0 ? 0.7 : 0.3;
    }

    console.log(`✨ [Create] Generated ${style} response, confidence: ${(confidence * 100).toFixed(0)}%`);
    return { text, confidence };
  }

  addTemplate(name: string, template: string): void {
    this.creativeState.templates.set(name, template);
    console.log(`✨ [Create] Added template: ${name}`);
  }

  fillTemplate(name: string, variables: Record<string, string>): string {
    const template = this.creativeState.templates.get(name);
    if (!template) return `Template "${name}" not found`;

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // ============================================================================
  // COGNITIVE STATS - Extended statistics
  // ============================================================================

  getCognitiveStats(): {
    memory: { longTerm: number; shortTerm: number; episodic: number; working: number };
    learning: { patterns: number; associations: number; reinforcements: number };
    reasoning: { rules: number; causalChains: number };
    problemSolving: { attempts: number; solutions: number };
    creativity: { generated: number; combinations: number; templates: number };
  } {
    return {
      memory: {
        longTerm: this.longTermMemory.size,
        shortTerm: this.shortTermMemory.items.length,
        episodic: this.episodicMemory.episodes.length,
        working: this.workingMemory.currentContext.length
      },
      learning: {
        patterns: this.learningState.patterns.size,
        associations: this.learningState.associations.size,
        reinforcements: this.learningState.reinforcements.size
      },
      reasoning: {
        rules: this.inferenceRules.length,
        causalChains: this.causalChains.size
      },
      problemSolving: {
        attempts: this.problemState.attempts,
        solutions: this.problemState.solutions.length
      },
      creativity: {
        generated: this.creativeState.generatedCount,
        combinations: this.creativeState.combinations.length,
        templates: this.creativeState.templates.size
      }
    };
  }
}

export const brainEngine = new BrainEngine();
export { BrainEngine, MemoryNode };
