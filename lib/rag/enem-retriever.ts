// SERVER-SIDE ONLY — do not import in Client Components.

import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";

export interface EnemQuestion {
  id: string;
  source: string;
  exam_year: number;
  question_number: number;
  area: string | null;
  question: string;
  choices: { label: string; text: string }[];
  answer: string;
  has_image: boolean;
  image_url: string | null;
  image_description: string | null;
  similarity: number;
}

export async function retrieveEnemQuestions(params: {
  query: string;
  area?: "linguagens" | "humanas" | "natureza" | "matematica";
  yearMin?: number;
  matchCount?: number;
}): Promise<EnemQuestion[]> {
  const { query, area, yearMin, matchCount = 5 } = params;

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  const supabase = await createClient();

  // Fetch a larger pool to avoid same-year clustering from embedding similarity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("match_enem_questions", {
    query_embedding: embedding,
    match_count: matchCount * 4,
    filter_area: area ?? null,
    filter_year_min: yearMin ?? null,
  });

  if (error) {
    throw new Error(`match_enem_questions RPC failed: ${error.message}`);
  }

  const pool = (data ?? []) as EnemQuestion[];

  // Shuffle and sample to ensure year diversity
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, matchCount);
}
