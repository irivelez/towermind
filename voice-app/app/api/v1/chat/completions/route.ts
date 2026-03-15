import { NextRequest } from "next/server";
import { TOWERMIND_SYSTEM_PROMPT } from "../../../knowledge";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://204.168.142.104:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "";

// OpenAI-compatible proxy for ElevenLabs Custom LLM → OpenClaw
// Injects TowerMind knowledge base as system context
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Prepend knowledge base system message if not already present
    const messages = Array.isArray(body.messages) ? [...body.messages] : [];
    const hasSystemContext = messages.some(
      (m: { role: string; content: string }) =>
        m.role === "system" && m.content.includes("TowerMind")
    );
    if (!hasSystemContext) {
      messages.unshift({ role: "system", content: TOWERMIND_SYSTEM_PROMPT });
    }

    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
        "x-openclaw-agent-id": "main",
      },
      body: JSON.stringify({
        ...body,
        messages,
        model: "openclaw",
        user: "towermind-elevenlabs",
        stream: body.stream ?? false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: { message: `OpenClaw error: ${response.status} ${text}` } }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // If streaming, pipe through SSE
    if (body.stream && response.body) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OpenAI proxy error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Failed to connect to TowerMind backend" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
