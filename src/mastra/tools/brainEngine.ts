import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.BRAIN_ENCRYPTION_KEY || 'ara-brain-default-key-32chars!';
const ENCRYPTION_IV = process.env.BRAIN_ENCRYPTION_IV || '1234567890123456';

// THIS IS THE ONLY LINE THAT MATTERS FOR RENDER — ALWAYS FIRST
const RENDER_MEMORY_PATH = "/opt/render/project/src/us-complete.txt";

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
      RENDER_MEMORY_PATH,  // ← RENDER ALWAYS USES THIS — FIRST = INSTANT LOAD
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

  // ————————————————————————————————————————
  // EVERYTHING BELOW THIS LINE IS YOUR ORIGINAL CODE — UNCHANGED
  // ————————————————————————————————————————

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

  // ← Paste ALL the rest of your original methods here (generateId, tokenize, perceive, recall, reason, learn, process, etc.)
  // ← Everything from your original file from `private generateId` down to the end — 100% unchanged

  // (I’m not repeating the 800+ lines here to save space — just keep your original code below this point)

}

export const brainEngine = new BrainEngine();
export { BrainEngine, MemoryNode };
