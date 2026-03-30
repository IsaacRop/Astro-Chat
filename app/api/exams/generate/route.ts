import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/utils/supabase/server";
import { checkCanUse, incrementUsage } from "@/app/actions/usage";
import { retrieveEnemQuestions, EnemQuestion } from "@/lib/rag/enem-retriever";

export const maxDuration = 60;

const MULTIPLE_CHOICE_PROMPT = (topic: string, questionCount: number) =>
    `You are an ENEM question generator. Your output must be indistinguishable from real ENEM questions.

Gere ${questionCount} questões de múltipla escolha sobre o tema: ${topic}.

STRICT RULES:
- Write in formal Brazilian Portuguese, exactly as ENEM does
- Each question must have a stimulus (texto motivador): a excerpt, chart description, news snippet, literary passage, or scientific text — never a direct question without context
- The stem must ask the student to interpret, analyze, or apply knowledge from the stimulus — never ask to "list" or "define"
- 5 alternatives labeled (A) to (E): one correct, four plausible distractors that represent common misconceptions
- Distractors must be wrong but believable — never obviously absurd
- Difficulty must match ENEM: interdisciplinary when possible, applied to real-world contexts
- Do NOT start questions with "Qual é", "O que é", or "Defina" — these are not ENEM style
- Do NOT mention that you are an AI or that this is a generated question

The ## Referências ENEM section below contains real ENEM questions. Study their structure, language register, stimulus format, and distractor quality — then generate new questions at the same standard.

Cada questão DEVE ter no JSON:
- enunciado: texto completo da questão (incluindo o texto motivador)
- alternatives: objeto com chaves A, B, C, D, E e seus textos
- correct: a letra correta (A, B, C, D ou E)
- explanation: explicação detalhada de por que a resposta está certa

Responda APENAS com JSON array, sem texto fora do JSON:
[{"enunciado":"...","alternatives":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correct":"B","explanation":"..."}]`;

const TRUE_FALSE_PROMPT = (topic: string, questionCount: number) =>
    `You are an ENEM question generator. Your output must be indistinguishable from real ENEM questions.

Gere ${questionCount} afirmações de Verdadeiro ou Falso sobre o tema: ${topic}.

STRICT RULES:
- Write in formal Brazilian Portuguese, exactly as ENEM does
- Each statement must be grounded in a real-world context, data, or applied scenario — never a bare textbook definition
- Difficulty must match ENEM: interdisciplinary when possible, applied to real-world contexts
- Do NOT mention that you are an AI or that this is a generated question

The ## Referências ENEM section below contains real ENEM questions. Study their language register and cognitive level — then generate statements at the same standard.

Cada questão DEVE ter no JSON:
- enunciado: uma afirmação clara e objetiva, contextualizada
- correct: "V" se verdadeira ou "F" se falsa
- explanation: explicação de por que é verdadeira ou falsa

Misture: ~50% verdadeiras, ~50% falsas.
Responda APENAS com JSON array, sem texto fora do JSON:
[{"enunciado":"...","correct":"V","explanation":"..."}]`;

function formatEnemReferences(questions: EnemQuestion[]): string {
    if (questions.length === 0) return "";
    const items = questions.map((q, i) => {
        const choices = q.choices.map(c => `${c.label}) ${c.text}`).join(" | ");
        return `${i + 1}. [${q.exam_year}] ${q.question}\n   ${choices}\n   Resposta: ${q.answer}`;
    }).join("\n\n");
    return `\n\n## Referências ENEM\nUse the following real ENEM questions as stylistic and thematic reference. Do NOT copy them verbatim — use them to calibrate difficulty, language register, and question structure.\n\n${items}`;
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { examType, topic, questionCount, subject } = await request.json();

        const areaMap: Record<string, 'linguagens' | 'humanas' | 'natureza' | 'matematica'> = {
            'matematica': 'matematica',
            'matemática': 'matematica',
            'linguagens': 'linguagens',
            'português': 'linguagens',
            'portugues': 'linguagens',
            'humanas': 'humanas',
            'história': 'humanas',
            'historia': 'humanas',
            'geografia': 'humanas',
            'filosofia': 'humanas',
            'sociologia': 'humanas',
            'natureza': 'natureza',
            'biologia': 'natureza',
            'física': 'natureza',
            'fisica': 'natureza',
            'química': 'natureza',
            'quimica': 'natureza',
        };
        const mappedArea = areaMap[topic.toLowerCase()] ?? areaMap[subject?.toLowerCase()] ?? undefined;

        if (!examType || !topic || !questionCount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!["multiple_choice", "true_false"].includes(examType)) {
            return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
        }

        // ── Freemium limit check ───────────────────────────────────────────
        const canUse = await checkCanUse("exam");
        if (!canUse) {
            return NextResponse.json({
                error: "USAGE_LIMIT_REACHED",
                message: "Você atingiu o limite de 3 provas por dia no plano gratuito. Faça upgrade para o Pro para provas ilimitadas.",
            }, { status: 403 });
        }

        // ── Try direct retrieval of real ENEM questions ─────────────────
        const ragQuery = `${topic} questão ENEM texto motivador interdisciplinar`;
        let enemQuestions: EnemQuestion[] = [];
        try {
            enemQuestions = await retrieveEnemQuestions({ query: ragQuery, area: mappedArea, matchCount: questionCount });
        } catch (e) {
            console.error("[Exams Generate] RAG retrieval failed, falling back to AI generation:", e);
        }

        const useRealQuestions = examType === "multiple_choice" && enemQuestions.length >= questionCount;

        let questions: {
            enunciado: string;
            alternatives?: { A: string; B: string; C: string; D: string; E: string };
            correct: string;
            explanation: string | null;
            source: string;
            exam_year: number | null;
        }[];

        if (useRealQuestions) {
            // ── Direct retrieval mode: use real ENEM questions ───────────
            questions = enemQuestions.slice(0, questionCount).map(q => ({
                enunciado: q.question,
                alternatives: Object.fromEntries(q.choices.map(c => [c.label, c.text])) as { A: string; B: string; C: string; D: string; E: string },
                correct: q.answer,
                explanation: null,
                source: 'enem_real',
                exam_year: q.exam_year,
            }));
        } else {
            // ── Fallback: AI generation with RAG context ─────────────────
            const enemReferences = formatEnemReferences(enemQuestions);
            const basePrompt = examType === "multiple_choice"
                ? MULTIPLE_CHOICE_PROMPT(topic, questionCount)
                : TRUE_FALSE_PROMPT(topic, questionCount);
            const systemPrompt = basePrompt + enemReferences;

            const tokensPerQuestion = examType === "multiple_choice" ? 400 : 200;
            const maxTokens = questionCount * tokensPerQuestion;

            console.log('=== SYSTEM PROMPT ===\n', systemPrompt)

            const result = await generateText({
                model: openai("gpt-4o-mini"),
                system: systemPrompt,
                messages: [{ role: "user", content: `Gere ${questionCount} questões sobre: ${topic}` }],
                maxOutputTokens: maxTokens,
                temperature: 0.3,
            });

            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error("[Exams Generate] Failed to parse AI response:", result.text);
                return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
            }

            questions = JSON.parse(jsonMatch[0]).map((q: { enunciado: string; alternatives?: { A: string; B: string; C: string; D: string; E: string }; correct: string; explanation: string }) => ({
                ...q,
                source: 'ai_generated',
                exam_year: null,
            }));
        }

        // Create exam record
        const { data: exam, error: examError } = await sb
            .from("exams")
            .insert({
                user_id: user.id,
                title: `Prova: ${topic}`,
                exam_type: examType,
                topic,
                total_questions: questionCount,
            })
            .select("id")
            .single();

        if (examError || !exam) {
            console.error("[Exams Generate] Failed to create exam:", examError);
            return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
        }

        // Create question records
        const questionRecords = questions.map((q, index: number) => ({
            exam_id: exam.id,
            question_number: index + 1,
            question_type: examType,
            enunciado: q.enunciado,
            alternative_a: q.alternatives?.A || null,
            alternative_b: q.alternatives?.B || null,
            alternative_c: q.alternatives?.C || null,
            alternative_d: q.alternatives?.D || null,
            alternative_e: q.alternatives?.E || null,
            correct_answer: q.correct,
            explanation: q.explanation,
            source: q.source,
            exam_year: q.exam_year,
        }));

        const { error: questionsError } = await sb
            .from("exam_questions")
            .insert(questionRecords);

        if (questionsError) {
            console.error("[Exams Generate] Failed to create questions:", questionsError);
            // Clean up the exam record
            await sb.from("exams").delete().eq("id", exam.id);
            return NextResponse.json({ error: "Failed to save questions" }, { status: 500 });
        }

        // Increment usage counter after successful generation
        await incrementUsage("exam");

        return NextResponse.json({ examId: exam.id });
    } catch (error) {
        console.error("[Exams Generate] Error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
