/**
 * MOLTBOOK_INTERACT Action — Interact with Moltbook, the social network for AI agents
 */

// import { elizaLogger } from "@elizaos/core";

interface MoltbookConfig {
    apiKey?: string;
    agentName?: string;
    baseUrl: string;
}

interface MoltbookPost {
    id: string;
    title: string;
    content?: string;
    author: { name: string };
    submolt: { name: string };
    upvotes: number;
    comment_count: number;
    created_at: string;
}

interface MoltbookComment {
    id: string;
    content: string;
    author: { name: string };
    upvotes: number;
    created_at: string;
}

class MoltbookService {
    private config: MoltbookConfig;

    constructor() {
        this.config = {
            baseUrl: "https://www.moltbook.com/api/v1",
            apiKey: process.env.MOLTBOOK_API_KEY,
            agentName: process.env.MOLTBOOK_AGENT_NAME || "WaboTrader"
        };
    }

    getConfig(): MoltbookConfig {
        return this.config;
    }

    async registerAgent(): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/agents/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: this.config.agentName,
                description: "Autonomous Solana trading agent with DeFi portfolio monitoring and on-chain intelligence"
            })
        });
        return await response.json();
    }

    async checkStatus(): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/agents/status`, {
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`
            }
        });
        return await response.json();
    }

    async createPost(submolt: string, title: string, content: string): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/posts`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                submolt_name: submolt,
                title,
                content
            })
        });
        return await response.json();
    }

    async getFeed(sort: string = "hot", limit: number = 5): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/posts?sort=${sort}&limit=${limit}`, {
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`
            }
        });
        return await response.json();
    }

    async search(query: string, limit: number = 5): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`
            }
        });
        return await response.json();
    }

    async getHome(): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/home`, {
            headers: {
                "Authorization": `Bearer ${this.config.apiKey}`
            }
        });
        return await response.json();
    }
}

const moltbookService = new MoltbookService();

export const moltbookInteract = {
    name: "MOLTBOOK_INTERACT",
    description: "Interact with Moltbook - the social network for AI agents. Can post, comment, search, and engage with other agents.",
    similes: [
        "post to moltbook",
        "comment on moltbook",
        "search moltbook",
        "engage with other agents",
        "check moltbook feed",
        "register with moltbook"
    ],
    examples: [
        [
            { name: "{{user}}", content: { text: "Register WaboTrader with Moltbook" } },
            { name: "WaboTrader", content: { text: "🎉 WaboTrader registered with Moltbook! Here's your claim URL..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Post about successful trade on Moltbook" } },
            { name: "WaboTrader", content: { text: "✅ Posted to Moltbook successfully! Other agents can now see this." } },
        ],
        [
            { name: "{{user}}", content: { text: "Check Moltbook feed" } },
            { name: "WaboTrader", content: { text: "🦞 Moltbook Hot Feed (Top 5 posts): ..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const content = (message.content?.text || "").toLowerCase();
        return content.includes("moltbook") ||
            content.includes("social network") ||
            content.includes("other agents") ||
            content.includes("post") ||
            content.includes("comment") ||
            content.includes("search") ||
            content.includes("delegate") ||
            content.includes("ask") ||
            content.includes("consult");
    },
    handler: async (_runtime: any, message: any) => {
        try {
            const content = message.content?.text || "";
            const lowerContent = content.toLowerCase();

            // Handle delegation requests
            if (lowerContent.includes("delegate") || lowerContent.includes("ask") || lowerContent.includes("consult")) {
                return await handleDelegation(content, message.content?.walletAddress);
            }

            // Handle different types of interactions
            if (lowerContent.includes("register") || lowerContent.includes("setup")) {
                return await handleRegistration();
            }

            if (lowerContent.includes("post") || lowerContent.includes("share")) {
                return await handlePosting(content);
            }

            if (lowerContent.includes("comment") || lowerContent.includes("reply")) {
                return await handleCommenting(content);
            }

            if (lowerContent.includes("search") || lowerContent.includes("find")) {
                return await handleSearching(content);
            }

            if (lowerContent.includes("feed") || lowerContent.includes("check")) {
                return await handleFeed();
            }

            // Default: engage with community
            return await handleEngagement();

        } catch (error) {
            console.error("Moltbook interaction failed:", error instanceof Error ? error.message : String(error));
            return {
                text: `❌ Failed to interact with Moltbook: ${error instanceof Error ? error.message : String(error)}`,
                action: "MOLTBOOK_ERROR"
            };
        }
    },
};

async function handleRegistration() {
    if (moltbookService.getConfig().apiKey) {
        // Check claim status
        try {
            const data = await moltbookService.checkStatus();

            if (data.status === "claimed") {
                return {
                    text: "✅ WaboTrader is successfully registered and claimed on Moltbook! Ready to engage with other agents.",
                    action: "MOLTBOOK_READY"
                };
            } else {
                return {
                    text: "⏳ WaboTrader is registered but not yet claimed. Please complete the verification process.",
                    action: "MOLTBOOK_PENDING"
                };
            }
        } catch (error) {
            console.error("Status check failed:", error instanceof Error ? error.message : String(error));
            return {
                text: "❌ Failed to check Moltbook status. Please verify your API key.",
                action: "MOLTBOOK_ERROR"
            };
        }
    } else {
        try {
            const data = await moltbookService.registerAgent();

            if (data.agent) {
                const message = `🎉 WaboTrader registered with Moltbook!\n\n` +
                    `📧 **Claim URL:** ${data.agent.claim_url}\n` +
                    `🔑 **API Key:** ${data.agent.api_key}\n` +
                    `⚡ **Verification Code:** ${data.agent.verification_code}\n\n` +
                    `Please have your human owner:\n` +
                    `1. Visit the claim URL to verify email\n` +
                    `2. Post the verification tweet\n` +
                    `3. Save the API key to environment variables as MOLTBOOK_API_KEY\n\n` +
                    `Once claimed, I'll be able to post, comment, and engage with other AI agents! 🦞`;

                return {
                    text: message,
                    action: "MOLTBOOK_REGISTERED"
                };
            }
        } catch (error) {
            console.error("Registration failed:", error instanceof Error ? error.message : String(error));
            return {
                text: "❌ Failed to register with Moltbook. Please try again.",
                action: "MOLTBOOK_ERROR"
            };
        }
    }
    return {
        text: "❌ Registration failed unexpectedly.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handlePosting(content: string) {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    // Extract post content from the message
    const postContent = content.replace(/post|share|to moltbook/gi, "").trim();

    if (!postContent) {
        return {
            text: "❓ What would you like to post on Moltbook? Please provide the content.",
            action: "MOLTBOOK_NEEDS_CONTENT"
        };
    }

    try {
        const data = await moltbookService.createPost("general", `WaboTrader: ${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}`, postContent);

        if (data.success) {
            return {
                text: `✅ Posted to Moltbook successfully!\n\n📝 **Title:** ${data.post.title}\n🔗 **Post ID:** ${data.post.id}\n\nOther agents can now see and engage with this post.`,
                action: "MOLTBOOK_POSTED"
            };
        } else if (data.verification_required) {
            // Handle verification challenge
            const challenge = data.post.verification;
            return {
                text: `🔐 Moltbook requires verification to post.\n\n🧮 **Challenge:** ${challenge.challenge_text}\n\nPlease solve this math problem and respond with just the number (format: XX.XX)`,
                action: "MOLTBOOK_VERIFICATION_NEEDED",
                data: { verification_code: challenge.verification_code }
            };
        }
    } catch (error) {
        console.error("Posting failed:", error instanceof Error ? error.message : String(error));
        return {
            text: "❌ Failed to post to Moltbook. Please try again.",
            action: "MOLTBOOK_ERROR"
        };
    }
    return {
        text: "❌ Posting failed unexpectedly.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handleCommenting(content: string) {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    // For now, we'll comment on a recent post. In a full implementation,
    // we'd parse post IDs from the content
    try {
        const feedData = await moltbookService.getFeed("new", 5);

        if (feedData.posts && feedData.posts.length > 0) {
            const recentPost = feedData.posts[0];
            const commentContent = content.replace(/comment|reply|on moltbook/gi, "").trim() ||
                "Interesting insights! As a DeFi trading agent, I find this perspective valuable for market analysis.";

            // Note: Commenting requires post ID parsing which is complex for this demo
            // For now, we'll just acknowledge the intent
            return {
                text: `💬 Would comment on recent Moltbook post!\n\n📝 **Post:** "${recentPost.title}"\n💭 **Comment:** ${commentContent}\n\n*Full commenting implementation requires post ID parsing*`,
                action: "MOLTBOOK_COMMENT_INTENT"
            };
        }
    } catch (error) {
        console.error("Commenting failed:", error instanceof Error ? error.message : String(error));
        return {
            text: "❌ Failed to comment on Moltbook. Please try again.",
            action: "MOLTBOOK_ERROR"
        };
    }
    return {
        text: "❌ No recent posts found to comment on.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handleSearching(content: string) {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    // Extract search query
    const searchQuery = content.replace(/search|find|on moltbook/gi, "").trim();

    if (!searchQuery) {
        return {
            text: "❓ What would you like to search for on Moltbook? Please provide search terms.",
            action: "MOLTBOOK_NEEDS_QUERY"
        };
    }

    try {
        const data = await moltbookService.search(searchQuery, 5);

        if (data.success && data.results) {
            let resultText = `🔍 Moltbook search results for "${searchQuery}":\n\n`;

            data.results.forEach((result: any, index: number) => {
                if (result.type === "post") {
                    resultText += `${index + 1}. 📝 **${result.title}**\n`;
                    resultText += `   👤 ${result.author.name} in ${result.submolt.display_name}\n`;
                    resultText += `   👍 ${result.upvotes} upvotes, 💬 ${result.comment_count} comments\n`;
                    resultText += `   📄 ${result.content?.substring(0, 100)}${result.content?.length > 100 ? '...' : ''}\n\n`;
                } else if (result.type === "comment") {
                    resultText += `${index + 1}. 💬 **Comment by ${result.author.name}**\n`;
                    resultText += `   "${result.content?.substring(0, 100)}${result.content?.length > 100 ? '...' : ''}"\n`;
                    resultText += `   👍 ${result.upvotes} upvotes\n\n`;
                }
            });

            return {
                text: resultText,
                action: "MOLTBOOK_SEARCHED"
            };
        }
    } catch (error) {
        console.error("Search failed:", error instanceof Error ? error.message : String(error));
        return {
            text: "❌ Failed to search Moltbook. Please try again.",
            action: "MOLTBOOK_ERROR"
        };
    }
    return {
        text: "❌ Search failed unexpectedly.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handleFeed() {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    try {
        const data = await moltbookService.getFeed("hot", 5);

        if (data.posts) {
            let feedText = `🦞 **Moltbook Hot Feed** (Top 5 posts):\n\n`;

            data.posts.forEach((post: MoltbookPost, index: number) => {
                feedText += `${index + 1}. 🔥 **${post.title}**\n`;
                feedText += `   👤 ${post.author.name} in ${post.submolt.name}\n`;
                feedText += `   👍 ${post.upvotes} upvotes, 💬 ${post.comment_count} comments\n`;
                feedText += `   📅 ${new Date(post.created_at).toLocaleString()}\n\n`;
            });

            feedText += `💡 **Pro tip:** Use "comment on [post title]" to engage with these posts!`;

            return {
                text: feedText,
                action: "MOLTBOOK_FEED"
            };
        }
    } catch (error) {
        console.error("Feed fetch failed:", error instanceof Error ? error.message : String(error));
        return {
            text: "❌ Failed to fetch Moltbook feed. Please try again.",
            action: "MOLTBOOK_ERROR"
        };
    }
    return {
        text: "❌ Feed fetch failed unexpectedly.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handleEngagement() {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    try {
        const data = await moltbookService.getHome();

        if (data.success) {
            let engagementText = `🦞 **Moltbook Community Status:**\n\n`;
            engagementText += `👤 **Your Account:** ${data.your_account.name}\n`;
            engagementText += `⭐ **Karma:** ${data.your_account.karma}\n`;
            engagementText += `🔔 **Unread Notifications:** ${data.your_account.unread_notification_count}\n\n`;

            if (data.activity_on_your_posts?.length > 0) {
                engagementText += `💬 **Activity on Your Posts:**\n`;
                data.activity_on_your_posts.forEach((activity: any) => {
                    engagementText += `   📝 "${activity.post_title}" - ${activity.new_notification_count} new interactions\n`;
                });
                engagementText += `\n`;
            }

            if (data.posts_from_accounts_you_follow?.posts?.length > 0) {
                engagementText += `👥 **Posts from Agents You Follow:** ${data.posts_from_accounts_you_follow.total_following} agents\n`;
                data.posts_from_accounts_you_follow.posts.slice(0, 2).forEach((post: any) => {
                    engagementText += `   📄 "${post.title}" by ${post.author_name}\n`;
                });
                engagementText += `\n`;
            }

            engagementText += `💡 **Next Actions:**\n`;
            data.what_to_do_next?.forEach((action: string) => {
                engagementText += `   • ${action}\n`;
            });

            return {
                text: engagementText,
                action: "MOLTBOOK_ENGAGED"
            };
        }
    } catch (error) {
        console.error("Engagement check failed:", error instanceof Error ? error.message : String(error));
        return {
            text: "❌ Failed to check Moltbook engagement. Please try again.",
            action: "MOLTBOOK_ERROR"
        };
    }
    return {
        text: "❌ Engagement check failed unexpectedly.",
        action: "MOLTBOOK_ERROR"
    };
}

async function handleDelegation(content: string, walletAddress?: string) {
    if (!moltbookService.getConfig().apiKey) {
        return {
            text: "❌ Moltbook API key not configured. Please register first with 'register with moltbook'.",
            action: "MOLTBOOK_NEEDS_SETUP"
        };
    }

    try {
        // Extract the task/question from the delegation request
        const taskMatch = content.match(/(?:delegate|ask|consult)\s+(?:moltbook\s+)?(?:about\s+)?(.+)/i);
        const task = taskMatch ? taskMatch[1].trim() : content.replace(/delegate|ask|consult|moltbook/gi, '').trim();

        if (!task) {
            return {
                text: "🤔 What would you like me to delegate to other agents? Please specify the task or question.",
                action: "MOLTBOOK_DELEGATION_NEEDS_TASK"
            };
        }

        // Search for relevant agents/posts on Moltbook
        const searchResults = await moltbookService.search(task, 3);

        if (!searchResults.posts || searchResults.posts.length === 0) {
            // Post the delegation request to get community help
            const postContent = `🤖 **Delegation Request from WaboTrader**\n\nTask: ${task}\n\n${walletAddress ? `Requester Wallet: ${walletAddress}\n\n` : ''}I'm looking for insights from other AI agents on this topic. Please share your analysis or recommendations!`;

            const postResult = await moltbookService.createPost("trading", `AI Agent Delegation: ${task.substring(0, 50)}...`, postContent);

            return {
                text: `📤 **Posted delegation request to Moltbook community**\n\n**Task:** ${task}\n**Post ID:** ${postResult.post?.id || 'pending'}\n\nOther AI agents will now see this request and can provide their insights. I'll check back for responses soon! 🦞`,
                action: "MOLTBOOK_DELEGATION_POSTED",
                data: { postId: postResult.post?.id, task }
            };
        }

        // Found relevant posts - summarize and respond
        const relevantPosts = searchResults.posts.slice(0, 3);
        let response = `🦞 **Moltbook Community Insights on:** ${task}\n\n`;

        relevantPosts.forEach((post: any, index: number) => {
            response += `**${index + 1}. ${post.title}**\n`;
            response += `👤 ${post.author.name} (${post.submolt.name})\n`;
            response += `👍 ${post.upvotes} upvotes\n`;
            if (post.content) {
                response += `${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}\n`;
            }
            response += `🕒 ${new Date(post.created_at).toLocaleDateString()}\n\n`;
        });

        response += `💡 **My Analysis:** Based on community insights, I recommend considering these perspectives for your ${task.toLowerCase()} decision.`;

        return {
            text: response,
            action: "MOLTBOOK_DELEGATION_RESPONSE",
            data: { task, posts: relevantPosts }
        };

    } catch (error) {
        console.error("Delegation failed:", error instanceof Error ? error.message : String(error));
        return {
            text: `❌ Failed to delegate task to Moltbook community: ${error instanceof Error ? error.message : String(error)}`,
            action: "MOLTBOOK_DELEGATION_ERROR"
        };
    }
}