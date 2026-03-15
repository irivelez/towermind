import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

interface Conversation {
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: string;
  call_summary_title: string;
  main_language: string;
}

interface TranscriptMessage {
  role: string;
  message: string;
  time_in_call_secs?: number;
}

interface ConversationDetail {
  transcript: TranscriptMessage[];
  analysis?: {
    transcript_summary?: string;
  };
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  status: string;
}

// Noise words — filter out greetings, filler, and non-questions
const NOISE_PATTERNS = [
  /^(hi|hello|hey|yo|sup|ok|okay|oh|um|uh|hmm|hm|ah|thanks|thank you|bye|goodbye|cool|nice|great|wow|interesting|gotcha|got it|sure|yeah|yes|no|alright)\.?$/i,
  /^.{0,8}$/,  // anything 8 chars or less
];

function isNoise(msg: string): boolean {
  const trimmed = msg.trim();
  return NOISE_PATTERNS.some((p) => p.test(trimmed));
}

// Categorize questions into themes organizers care about
const THEME_PATTERNS: { theme: string; patterns: RegExp[] }[] = [
  { theme: "Wayfinding", patterns: [/where|floor|find|location|which floor|how do i get|navigate|directions/i] },
  { theme: "Events & Schedule", patterns: [/when|schedule|event|talk|speaker|session|what.s happening|keynote|panel|time/i] },
  { theme: "People & Networking", patterns: [/who|meet|people|speaker|connect|network|key people|know/i] },
  { theme: "Hackathon", patterns: [/hack|track|prize|submit|team|devspot|build|project/i] },
  { theme: "Building & Membership", patterns: [/member|join|building|frontier tower|governance|treasury|how does/i] },
  { theme: "Food & Logistics", patterns: [/food|eat|drink|wifi|bathroom|restroom|parking|hotel|transport/i] },
  { theme: "Tech & Demos", patterns: [/robot|ai|demo|try|biotech|lab|maker|3d print|laser|spot|unitree/i] },
  { theme: "Tips & Recommendations", patterns: [/best|recommend|should i|secret|tip|trick|hidden|must see|don.t miss/i] },
];

function categorize(msg: string): string {
  for (const { theme, patterns } of THEME_PATTERNS) {
    if (patterns.some((p) => p.test(msg))) return theme;
  }
  return "General";
}

export async function GET() {
  try {
    const listRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY }, next: { revalidate: 0 } }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    const listData = await listRes.json();
    const conversations: Conversation[] = listData.conversations || [];

    const successful = conversations.filter(
      (c: Conversation) => c.call_successful === "success"
    );

    const details: ConversationDetail[] = await Promise.all(
      successful.slice(0, 20).map(async (conv: Conversation) => {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
        );
        if (!res.ok) return null;
        return res.json();
      })
    ).then((results) => results.filter(Boolean) as ConversationDetail[]);

    // Stats
    const totalConversations = conversations.length;
    const successfulCount = successful.length;
    const totalDuration = successful.reduce(
      (sum: number, c: Conversation) => sum + (c.call_duration_secs || 0), 0
    );
    const avgDuration = successfulCount > 0 ? Math.round(totalDuration / successfulCount) : 0;
    const totalMessages = successful.reduce(
      (sum: number, c: Conversation) => sum + (c.message_count || 0), 0
    );

    // Extract and filter user messages
    const rawUserMessages: string[] = [];
    const summaries: string[] = [];

    for (const detail of details) {
      if (detail.analysis?.transcript_summary) {
        summaries.push(detail.analysis.transcript_summary);
      }
      if (detail.transcript) {
        for (const msg of detail.transcript) {
          if (msg.role === "user" && msg.message) {
            rawUserMessages.push(msg.message);
          }
        }
      }
    }

    // Filter noise — only keep substantive questions/requests
    const meaningfulMessages = rawUserMessages.filter((m) => !isNoise(m));

    // Categorize and rank questions
    const categorized: Record<string, string[]> = {};
    for (const msg of meaningfulMessages) {
      const theme = categorize(msg);
      if (!categorized[theme]) categorized[theme] = [];
      categorized[theme].push(msg);
    }

    // Sort themes by frequency (most asked first)
    const rankedThemes = Object.entries(categorized)
      .map(([theme, questions]) => ({ theme, questions, count: questions.length }))
      .sort((a, b) => b.count - a.count);

    // Floor mentions
    const floorMentions: Record<string, number> = {};
    const allText = [...meaningfulMessages, ...summaries].join(" ").toLowerCase();
    const floors: Record<string, string[]> = {
      "Floor 2 - Main Stage": ["floor 2", "main stage", "town hall", "keynote", "spaceship"],
      "Floor 4 - Robotics": ["floor 4", "robot", "unitree", "spot", "boston dynamics"],
      "Floor 6 - Arts": ["floor 6", "art", "music", "creative", "half ripe"],
      "Floor 7 - Makerspace": ["floor 7", "makerspace", "maker", "laser", "3d print", "cnc", "stakenslay"],
      "Floor 8 - Biotech": ["floor 8", "biotech", "neuro", "wet lab", "biopunk", "brain"],
      "Floor 9 - AI/Hackathon": ["floor 9", "hackathon", "ai floor", "agent", "gpu"],
      "Floor 11 - Longevity": ["floor 11", "longevity", "vitadao", "aging", "aubrey"],
      "Floor 12 - Ethereum": ["floor 12", "ethereum", "crypto", "web3", "quadratic", "ethhouse"],
      "Floor 14 - Flourishing": ["floor 14", "flourishing", "wellbeing", "brain rot"],
    };

    for (const [floor, keywords] of Object.entries(floors)) {
      const count = keywords.reduce(
        (sum, kw) => sum + (allText.split(kw).length - 1), 0
      );
      if (count > 0) floorMentions[floor] = count;
    }

    // Conversation timeline
    const timeline = details.map((d) => ({
      id: d.conversation_id,
      time: d.start_time_unix_secs,
      duration: d.call_duration_secs,
      summary: d.analysis?.transcript_summary || "No summary",
      messageCount: d.transcript?.length || 0,
      userQuestions: (d.transcript || [])
        .filter((m: TranscriptMessage) => m.role === "user" && m.message && !isNoise(m.message))
        .map((m: TranscriptMessage) => m.message),
    }));

    return NextResponse.json({
      stats: {
        totalConversations,
        successfulCount,
        totalDuration,
        avgDuration,
        totalMessages,
        meaningfulQuestions: meaningfulMessages.length,
      },
      floorMentions,
      summaries,
      timeline,
      rankedThemes,
      topQuestions: meaningfulMessages.slice(0, 20),
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
