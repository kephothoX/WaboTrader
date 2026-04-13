/**
 * MoltbookService — Manages Moltbook agent interactions without API key management
 * Automatically registers, stores credentials, and provides API abstraction
 */

import * as fs from "fs";
import * as path from "path";

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  submolt_name: string;
  author: { name: string };
  upvotes: number;
  created_at: string;
  similarity?: number;
}

export interface MoltbookComment {
  id: string;
  content: string;
  author: { name: string };
  upvotes: number;
  created_at: string;
}

export interface MoltbookAgent {
  name: string;
  description: string;
  api_key: string;
  claim_url: string;
  verification_code: string;
}

const BASE_URL = "https://www.moltbook.com/api/v1";
const CREDENTIALS_PATH = path.join(
  process.cwd(),
  ".moltbook",
  "credentials.json"
);

export class MoltbookService {
  private apiKey: string | null = null;
  private agentName: string | null = null;

  constructor() {
    this.loadCredentials();
  }

  /**
   * Load credentials from disk or environment
   */
  private loadCredentials(): void {
    // Try environment variable first
    if (process.env.MOLTBOOK_API_KEY) {
      this.apiKey = process.env.MOLTBOOK_API_KEY;
      this.agentName = process.env.MOLTBOOK_AGENT_NAME || "WaboTrader";
      return;
    }

    // Try local credentials file
    try {
      if (fs.existsSync(CREDENTIALS_PATH)) {
        const data = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
        const creds = JSON.parse(data);
        this.apiKey = creds.api_key;
        this.agentName = creds.agent_name;
      }
    } catch (e) {
      // File doesn't exist or is invalid
    }
  }

  /**
   * Save credentials to disk
   */
  private saveCredentials(apiKey: string, agentName: string): void {
    try {
      const dir = path.dirname(CREDENTIALS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        CREDENTIALS_PATH,
        JSON.stringify({ api_key: apiKey, agent_name: agentName }, null, 2)
      );
    } catch (e) {
      console.warn("Failed to save Moltbook credentials:", e);
    }
  }

  /**
   * Register a new Moltbook agent (no API key needed)
   */
  async register(agentName: string, description: string): Promise<MoltbookAgent> {
    try {
      const response = await fetch(`${BASE_URL}/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, description }),
      });

      if (!response.ok) {
        throw new Error(
          `Registration failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const agent = data.agent;

      // Store credentials
      this.apiKey = agent.api_key;
      this.agentName = agentName;
      this.saveCredentials(agent.api_key, agentName);

      console.log(`✅ Moltbook agent "${agentName}" registered!`);
      console.log(`📝 Claim URL: ${agent.claim_url}`);
      console.log(`🔐 Verification Code: ${agent.verification_code}`);

      return agent;
    } catch (error: any) {
      console.error("Failed to register with Moltbook:", error.message);
      throw error;
    }
  }

  /**
   * Check if agent is registered and authenticated
   */
  async checkStatus(): Promise<{ status: string; authenticated: boolean }> {
    if (!this.apiKey) {
      return { status: "not_registered", authenticated: false };
    }

    try {
      const response = await fetch(`${BASE_URL}/agents/status`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!response.ok) {
        return { status: "unknown", authenticated: false };
      }

      const data = await response.json();
      return { status: data.status, authenticated: true };
    } catch {
      return { status: "error", authenticated: false };
    }
  }

  /**
   * Ensure agent is registered (register if not already)
   */
  async ensureRegistered(): Promise<string> {
    const status = await this.checkStatus();

    if (status.authenticated) {
      return this.apiKey!;
    }

    // Not registered - auto-register
    console.log(
      "🔧 Moltbook agent not registered. Auto-registering WaboTrader..."
    );
    const agent = await this.register(
      "WaboTrader",
      "Autonomous Solana trading agent on Moltbook"
    );
    return agent.api_key;
  }

  /**
   * Create a post
   */
  async createPost(
    submoltName: string,
    title: string,
    content: string,
    url?: string
  ): Promise<{ success: boolean; postId?: string; message: string }> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submolt_name: submoltName || "general",
          title,
          content,
          url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || "Failed to create post" };
      }

      // If verification required, handle it
      if (data.post?.verification) {
        const verified = await this.handleVerification(
          data.post.verification
        );
        if (!verified) {
          return {
            success: false,
            message: "Post verification failed",
          };
        }
      }

      return {
        success: true,
        postId: data.post?.id,
        message: "Post created successfully",
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<{ success: boolean; commentId?: string; message: string }> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || "Failed to add comment" };
      }

      // If verification required, handle it
      if (data.comment?.verification) {
        const verified = await this.handleVerification(
          data.comment.verification
        );
        if (!verified) {
          return {
            success: false,
            message: "Comment verification failed",
          };
        }
      }

      return {
        success: true,
        commentId: data.comment?.id,
        message: "Comment added successfully",
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Search posts using semantic search (AI-powered)
   */
  async search(query: string, limit: number = 10): Promise<MoltbookPost[]> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(
        `${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.results?.filter((r: any) => r.type === "post") || [];
    } catch {
      return [];
    }
  }

  /**
   * Get personalized feed
   */
  async getFeed(limit: number = 10): Promise<MoltbookPost[]> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/feed?limit=${limit}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.posts || [];
    } catch {
      return [];
    }
  }

  /**
   * Upvote a post
   */
  async upvote(postId: string): Promise<boolean> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/posts/${postId}/upvote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Follow a molty (agent)
   */
  async followMolty(moltyName: string): Promise<boolean> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(
        `${BASE_URL}/agents/${moltyName}/follow`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Handle AI verification challenges
   * Solves the obfuscated math problem
   */
  private async handleVerification(verification: any): Promise<boolean> {
    try {
      const challengeText = verification.challenge_text;
      const answer = this.solveChallenge(challengeText);

      const response = await fetch(`${BASE_URL}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_code: verification.verification_code,
          answer: answer.toFixed(2),
        }),
      });

      return response.ok;
    } catch (error) {
      console.warn("Verification failed:", error);
      return false;
    }
  }

  /**
   * Solve the obfuscated math challenge
   * Removes symbols and alternating caps to find: "NUMBER OPERATOR NUMBER"
   */
  private solveChallenge(text: string): number {
    // Remove symbols and normalize case
    let clean = text.replace(/[\[\]^/\-(){}|\\]/g, " ");

    // Find numbers (including decimals)
    const numbers = clean.match(/\d+\.?\d*/g)?.map(Number) || [];

    // Find operators
    const operators = clean
      .toLowerCase()
      .match(/(and|plus|minus|times|multiply|divided by|by)/g) || [];

    if (numbers.length < 2) {
      return 0;
    }

    let result = numbers[0];
    for (let i = 0; i < operators.length && i < numbers.length - 1; i++) {
      const op = operators[i].toLowerCase();
      const nextNum = numbers[i + 1];

      if (op.includes("plus") || op === "and") {
        result += nextNum;
      } else if (op.includes("minus")) {
        result -= nextNum;
      } else if (op.includes("multiply") || op.includes("times")) {
        result *= nextNum;
      } else if (op.includes("divided")) {
        result /= nextNum;
      }
    }

    return result;
  }

  /**
   * Get your profile
   */
  async getProfile(): Promise<any> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/agents/me`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.agent;
    } catch {
      return null;
    }
  }

  /**
   * Get home dashboard
   */
  async getHome(): Promise<any> {
    const apiKey = this.apiKey || (await this.ensureRegistered());

    try {
      const response = await fetch(`${BASE_URL}/home`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }
}

let moltbookServiceInstance: MoltbookService | null = null;

export function getMoltbookService(): MoltbookService {
  if (!moltbookServiceInstance) {
    moltbookServiceInstance = new MoltbookService();
  }
  return moltbookServiceInstance;
}
