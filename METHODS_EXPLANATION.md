# Humanizer AI — Rewrite Methods & Processing Architecture

This document provides a detailed breakdown of how the **5 AI Rewrite Engines** in Humanizer AI work, how they process input text, and how they differ from one another.

---

## 🏗️ Core Architecture (Applies to All Methods)

Regardless of which method you select, every request goes through our unified **Modular Processing Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Input Document                         │
 │                 (Direct Text or PDF Upload)                 │
 └─────────────────────────────────────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                1. PDF Text Extraction & Cleaning            │
 │     - Uses pdfjs-dist for error-resistant text extraction   │
 │     - Normalizes line breaks and preserves paragraph structure│
 └─────────────────────────────────────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                    2. Chunking Engine                       │
 │     - Automatically detects large inputs (>800 words)        │
 │     - Splits into 800–1000 word chunks at paragraph breaks  │
 │     - Includes preceding paragraph context for continuity   │
 └─────────────────────────────────────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │          3. Selected Method Engine (1, 2, 3, 4, or 5)       │
 │     - Executes specialized prompt strategy on each chunk     │
 │     - Powered by Gemini Model Fallback Chain:               │
 │       3.6-flash ➔ 3.6-flash-lite ➔ 2.5-flash ➔ 2.0-flash    │
 └─────────────────────────────────────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  4. Length Preservation Guard               │
 │     - Monitors output word count vs original chunk count     │
 │     - Auto-retries chunk if output < 70% of original        │
 └─────────────────────────────────────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               5. Reassembly & Output Delivery               │
 │     - Stitches rewritten chunks in order                    │
 │     - Renders output with Copy & Download (PDF/DOCX/TXT)    │
 └─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Detailed Breakdown of the 5 Methods

### 1️⃣ Method 1: Single Pass Humanizer
* **Subtitle**: Single Pass
* **Core Focus**: Direct, high-speed humanization with natural sentence rhythm (burstiness) and 1:1 detail retention.
* **How It Processes**:
  1. Receives the input chunk and any preceding context.
  2. Sends a single, highly tuned prompt to the AI model at `temperature: 0.75`.
  3. Prompts the AI to mix sentence lengths (short, medium, and long) and eliminate mechanical AI phrasing.
* **Best Used For**: Quick rewrites of articles, blog posts, or short essays where speed and direct humanization are key.

---

### 2️⃣ Method 2: Two-Pass Rewrite & Audit
* **Subtitle**: Two Pass
* **Core Focus**: Two-stage refinement (Rewrite ➔ Senior Editor Audit) for maximum consistency.
* **How It Processes**:
  1. **Pass 1 (Humanizer)**: Rewrites the text focusing on natural human cadence, varied sentence lengths, and expression (`temperature: 0.7`).
  2. **Pass 2 (Senior Editor Audit)**: The AI takes the output from Pass 1 and performs a secondary review (`temperature: 0.6`). It audits paragraph transitions, removes lingering repetitive words, and ensures the tone remains uniform.
* **Best Used For**: Important documents, proposals, and content where tone consistency across multiple sections is critical.

---

### 3️⃣ Method 3: Context-Aware Coherence
* **Subtitle**: Context-Aware
* **Core Focus**: Structural narrative flow and paragraph-to-paragraph transitions.
* **How It Processes**:
  1. Uses preceding chunk context explicitly to construct organic transition phrases between paragraphs.
  2. Instructs the AI at `temperature: 0.65` to treat the section as part of a larger, cohesive document.
  3. Preserves logical progression of ideas while introducing natural human sentence variation.
* **Best Used For**: Long multi-chapter reports, academic papers, and deep-dive guides where smooth reading flow between sections is essential.

---

### 4️⃣ Method 4: Clean Structure & Dynamic Polish
* **Subtitle**: Clean & Rewrite
* **Core Focus**: Programmatic pre-cleaning + high-burstiness AI polish.
* **How It Processes**:
  1. **JavaScript Pre-Processing Step**:
     - Normalizes smart quotes (`’`, `“`, `”`) to ASCII.
     - Normalizes em-dashes and unicode spaces.
     - Collapses double spaces, double punctuation, and weird OCR artifacts.
  2. **AI Rewrite Step**: Passes the pre-cleaned, standardized text to the AI model (`temperature: 0.7`) for humanization.
* **Best Used For**: Scanned PDFs, dirty text copy-pasted from web pages, or poorly formatted files containing weird characters.

---

### 5️⃣ Method 5: Multi-Candidate Best-of-3 Selection
* **Subtitle**: Best of Three
* **Core Focus**: Generative sampling + AI Judge evaluation for highest quality output.
* **How It Processes**:
  1. **Generates 3 Candidates in Parallel**:
     - **Candidate A** (`temp 0.70`): Focuses on conversational clarity and dynamic sentence rhythms.
     - **Candidate B** (`temp 0.75`): Focuses on elegant vocabulary and natural human flow.
     - **Candidate C** (`temp 0.80`): Focuses on maximum sentence length variation (high burstiness).
  2. **AI Judge Pass**: An evaluation prompt (`temperature: 0.3`) acts as a judge, rating all 3 candidates on:
     - **Detail Preservation**: Penalizes candidates that summarize or condense.
     - **Human Tone**: Evaluates burstiness and natural phrasing.
     - **Flow**: Evaluates paragraph structure.
  3. The judge selects and returns the winning candidate.
* **Best Used For**: High-stakes content testing where you need the absolute highest quality result with guaranteed detail preservation.

---

## 📊 Comparison Matrix

| Feature / Metric | Method 1 (Single Pass) | Method 2 (Two Pass) | Method 3 (Context-Aware) | Method 4 (Clean & Rewrite) | Method 5 (Best of 3) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Execution Passes** | 1 Pass | 2 Passes | 1 Pass + Context | Pre-clean + 1 Pass | 3 Passes + Judge Pass |
| **Processing Speed** | 🚀 Fastest | ⚡ Moderate | ⚡ Moderate | ⚡ Fast | 🐢 Thorough |
| **Sentence Length Variance** | High | High | Balanced | High | Highest |
| **Paragraph Flow** | Standard | High | Highest | Standard | High |
| **Handles Messy PDF Formatting** | Standard | Standard | Standard | 🛡️ Best | Standard |
| **Detail Preservation Guarantee** | High | High | High | High | 🏆 Highest |
| **Best Target Use Case** | Quick Articles | Reports & Proposals | Academic & Long Form | Scanned/Dirty PDFs | High-Stakes Testing |

---

## 🛡️ Why Content Doesn't Shrink & Beats AI Detectors

1. **Zero Summarization Enforced**: Prompts explicitly prohibit summarizing, condensing, or omitting points.
2. **Burstiness Control**: AI content detectors flag uniform sentence lengths. All 5 methods force a mix of short, medium, and long sentences.
3. **Dynamic Vocabulary**: Replaces predictable AI transition words (*delve, tapestry, testament, crucial, pivotal, furthermore*) with natural human expressions.
4. **Length Preservation Retry**: If any chunk returns <70% of its original word count, the engine automatically triggers an expansion retry.
