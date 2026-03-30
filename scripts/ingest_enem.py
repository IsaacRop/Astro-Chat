"""
Ingest ENEM questions into the enem_questions Supabase table.

Loads two HuggingFace datasets:
  - eduagarcia/enem_challenge  (2009–2017, text only)
  - maritaca-ai/enem           (2022, 2023, 2024 — includes images)

Generates embeddings with text-embedding-3-small and upserts into Supabase.

Required env vars: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Install deps:  pip install -r scripts/requirements.txt
"""

import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

# Load .env.local from project root regardless of working directory
load_dotenv(Path(__file__).parent.parent / ".env.local")
load_dotenv(Path(__file__).parent.parent / ".env")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not all([OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    sys.exit(
        "Missing env vars. Ensure OPENAI_API_KEY, SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), "
        "and SUPABASE_SERVICE_ROLE_KEY are set."
    )

from datasets import load_dataset
from openai import OpenAI
from supabase import create_client

openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

LABELS = ["A", "B", "C", "D", "E"]

# ---------------------------------------------------------------------------
# Area inference for enem_challenge (2009 only — 180 sequential questions)
# From 2010 onward, question numbers reset per booklet and area cannot be
# reliably inferred without external metadata.
# ---------------------------------------------------------------------------
AREA_RANGES_2009 = [
    (1, 45, "natureza"),
    (46, 90, "humanas"),
    (91, 135, "linguagens"),
    (136, 180, "matematica"),
]


def infer_area_enem_challenge(exam_year: int, question_number: int) -> str | None:
    if exam_year == 2009:
        for lo, hi, area in AREA_RANGES_2009:
            if lo <= question_number <= hi:
                return area
    return None


# ---------------------------------------------------------------------------
# Normalize enem_challenge rows
# choices format: { "text": [...], "label": [...] }
# ---------------------------------------------------------------------------
def normalize_enem_challenge(row: dict) -> dict | None:
    if row.get("nullified"):
        return None

    exam_year = int(row["exam_year"])
    question_number = int(row["question_number"])

    # Skip 2022-2023 rows — they were pulled from maritaca and we ingest
    # maritaca directly with richer data (images, descriptions).
    if exam_year >= 2022:
        return None

    choices_raw = row["choices"]
    choices = [
        {"label": lbl, "text": txt}
        for lbl, txt in zip(choices_raw["label"], choices_raw["text"])
    ]

    return {
        "source": "enem_challenge",
        "exam_year": exam_year,
        "question_number": question_number,
        "area": infer_area_enem_challenge(exam_year, question_number),
        "question": row["question"],
        "choices": choices,
        "answer": row["answerKey"],
        "has_image": False,
        "image_url": None,
        "image_description": None,
    }


# ---------------------------------------------------------------------------
# Normalize maritaca rows
# alternatives: flat list of 5 strings (positional: 0=A … 4=E)
# figures / description: parallel arrays of URLs / text
# ---------------------------------------------------------------------------
def normalize_maritaca(row: dict, subset_year: int) -> dict | None:
    alternatives = row["alternatives"]
    choices = [
        {"label": LABELS[i], "text": txt}
        for i, txt in enumerate(alternatives)
    ]

    figures = row.get("figures") or []
    descriptions = row.get("description") or []

    has_image = len(figures) > 0
    image_url = figures[0] if figures else None
    image_description = descriptions[0] if descriptions else None

    # Extract question number from id like "questao_01"
    raw_id = row.get("id", "")
    try:
        question_number = int(raw_id.split("_")[1])
    except (IndexError, ValueError):
        question_number = 0

    answer = row["label"]
    # Skip annulled questions (answer is "Anulado" instead of A–E)
    if answer not in LABELS:
        return None

    return {
        "source": "maritaca",
        "exam_year": subset_year,
        "question_number": question_number,
        "area": None,
        "question": row["question"],
        "choices": choices,
        "answer": answer,
        "has_image": has_image,
        "image_url": image_url,
        "image_description": image_description,
    }


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------
def build_embedding_input(record: dict) -> str:
    choices_text = " | ".join(c["text"] for c in record["choices"])
    text = f"{record['question']}\n{choices_text}"
    if record.get("image_description"):
        text += f"\n{record['image_description']}"
    return text


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings in a single API call (batch <= 100)."""
    resp = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in resp.data]


# ---------------------------------------------------------------------------
# Upsert to Supabase
# ---------------------------------------------------------------------------
def upsert_batch(records: list[dict]) -> None:
    """Upsert a batch into enem_questions. Dedup on source+year+number."""
    supabase.table("enem_questions").upsert(
        records,
        on_conflict="source,exam_year,question_number",
    ).execute()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    all_records: list[dict] = []

    # --- enem_challenge (2009–2017) ---
    print("Loading eduagarcia/enem_challenge …")
    ds_challenge = load_dataset("eduagarcia/enem_challenge", split="train")
    skipped = 0
    for row in ds_challenge:
        normalized = normalize_enem_challenge(row)
        if normalized:
            all_records.append(normalized)
        else:
            skipped += 1
    print(f"  enem_challenge: {len(all_records)} questions loaded, {skipped} skipped")

    # --- maritaca (2022, 2023, 2024) ---
    for year in [2022, 2023, 2024]:
        print(f"Loading maritaca-ai/enem subset {year} …")
        ds = load_dataset("maritaca-ai/enem", str(year), split="train")
        count_before = len(all_records)
        skipped_m = 0
        for row in ds:
            normalized = normalize_maritaca(row, year)
            if normalized:
                all_records.append(normalized)
            else:
                skipped_m += 1
        loaded = len(all_records) - count_before
        print(f"  maritaca {year}: {loaded} questions loaded, {skipped_m} skipped")

    print(f"\nTotal questions to ingest: {len(all_records)}")

    # --- Generate embeddings in batches of 100 ---
    print("\nGenerating embeddings …")
    EMBED_BATCH = 100
    for i in range(0, len(all_records), EMBED_BATCH):
        batch = all_records[i : i + EMBED_BATCH]
        texts = [build_embedding_input(r) for r in batch]

        try:
            embeddings = generate_embeddings(texts)
        except Exception as e:
            print(f"  ERROR generating embeddings for batch {i}–{i + len(batch)}: {e}")
            # Retry once after a short pause
            time.sleep(5)
            try:
                embeddings = generate_embeddings(texts)
            except Exception as e2:
                print(f"  FATAL: retry failed: {e2}")
                sys.exit(1)

        for record, emb in zip(batch, embeddings):
            record["embedding"] = emb

        print(f"  Embedded {min(i + EMBED_BATCH, len(all_records))}/{len(all_records)}")

    # --- Upsert to Supabase in batches of 50 ---
    print("\nUpserting to Supabase …")
    UPSERT_BATCH = 50
    total_upserted = 0

    for i in range(0, len(all_records), UPSERT_BATCH):
        batch = all_records[i : i + UPSERT_BATCH]
        try:
            upsert_batch(batch)
            total_upserted += len(batch)
            print(f"  Upserted {total_upserted}/{len(all_records)}")
        except Exception as e:
            print(f"  ERROR upserting batch {i}–{i + len(batch)}: {e}")

    print(f"\nDone. {total_upserted}/{len(all_records)} questions ingested.")


if __name__ == "__main__":
    main()
