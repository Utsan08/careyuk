import Anthropic from "@anthropic-ai/sdk";
import { prettyCategory } from "./matching";

/**
 * Optional LLM polish for match_reason (Darren's checklist: "LLM blurb for
 * match_reason — polish, try/catch, falls back to template, only after
 * everything else works").
 *
 * It is intentionally dormant until the backend team supplies an API key:
 * with no ANTHROPIC_API_KEY set it returns the templated reason instantly
 * (no network call), so the app behaves exactly as it does today. Any error
 * also falls back to the template. When a key is present it rewrites the
 * reason as one warm, specific sentence.
 *
 * Uses the official Anthropic SDK with Claude Opus 4.8 (claude-opus-4-8).
 */

let cached: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!cached) cached = new Anthropic();
  return cached;
}

/** True when a polish call would actually hit the API (a key is configured). */
export function llmBlurbEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function polishMatchReason(
  volunteer: { faculty: string | null; interests: string[] | null },
  opportunity: { title: string | null; org: string | null; distanceKm?: number },
  template: string
): Promise<string> {
  const client = getClient();
  if (!client) return template;

  try {
    const interests = (volunteer.interests ?? []).map(prettyCategory).join(", ") || "community health";
    const distance = opportunity.distanceKm != null ? `, ${opportunity.distanceKm.toFixed(1)}km away` : "";

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 120,
      system:
        "You write one warm, specific sentence (20 words max) telling a health volunteer why an opportunity fits them. Reply with only the sentence — no preamble, no quotation marks.",
      messages: [
        {
          role: "user",
          content:
            `Volunteer interests: ${interests}. Faculty: ${volunteer.faculty ?? "unspecified"}. ` +
            `Opportunity: "${opportunity.title ?? "a health drive"}" by ${opportunity.org ?? "a local org"}${distance}. ` +
            `Templated reason to improve: ${template}`,
        },
      ],
    });

    const block = message.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";
    return text || template;
  } catch {
    return template;
  }
}
