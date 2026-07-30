/**
 * Stage — Entity Variation (Post-Rewrite NLP)
 *
 * Uses `compromise` NLP to detect entities (people, places, organizations)
 * in the AI-rewritten text and randomly replaces repeated mentions with
 * contextual descriptive phrases.
 *
 * This adds non-AI-predictable randomness that detection tools cannot
 * reverse-engineer, because entity substitution is probabilistic and
 * rule-based rather than model-generated.
 *
 * Rules:
 * - ALWAYS preserve the FIRST mention of any entity (for reader clarity)
 * - Only replace 2nd+ mentions with a 60% probability
 * - Never touch numbers, dates, or technical terms from the analyzer
 * - Operate on each rewritten chunk independently
 */

const nlp = require('compromise');
const Logger = require('../Logger');

// ─── Descriptive Phrase Pools ──────────────────────────────────────

const PERSON_DESCRIPTORS = [
  'the individual', 'the person', 'the professional',
  'the figure', 'the party', 'the expert',
  'the specialist', 'the contributor', 'the practitioner',
  'the aforementioned individual', 'they',
];

const PLACE_DESCRIPTORS = [
  'the region', 'the area', 'the locale',
  'the location', 'the territory', 'this place',
  'the zone', 'the district',
];

const ORG_DESCRIPTORS = [
  'the organization', 'the company', 'the institution',
  'the group', 'the entity', 'the firm',
  'the establishment', 'the body',
];

// ─── Helpers ───────────────────────────────────────────────────────

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a set of words that must never be replaced.
 */
function buildProtectedSet(analysis) {
  const protect = new Set();
  if (!analysis) return protect;

  // Technical terms
  (analysis.technicalTerms || []).forEach(t => {
    protect.add(t.toLowerCase());
    t.split(/\s+/).forEach(w => protect.add(w.toLowerCase()));
  });

  // Dates
  if (analysis.namedEntities) {
    (analysis.namedEntities.dates || []).forEach(d => protect.add(d.toLowerCase()));
  }

  return protect;
}

/**
 * Apply entity variation to a single text chunk.
 *
 * @param {string} text - Rewritten chunk text
 * @param {Set} protectedSet - Words not to touch
 * @returns {string} - Text with entity variations applied
 */
function applyEntityVariation(text, protectedSet) {
  const doc = nlp(text);
  let result = text;
  let replacementsApplied = 0;

  // ── People ──
  const people = doc.people().out('array');
  const uniquePeople = [...new Set(people.map(p => p.trim()).filter(p => p.length > 2))];

  for (const person of uniquePeople) {
    if (protectedSet.has(person.toLowerCase())) continue;

    // Count occurrences
    const regex = new RegExp(escapeRegex(person), 'g');
    const occurrences = (result.match(regex) || []).length;

    if (occurrences <= 1) continue; // Keep single mentions untouched

    // Replace 2nd+ occurrences with 60% probability each
    let firstSkipped = false;
    result = result.replace(regex, (match) => {
      if (!firstSkipped) {
        firstSkipped = true;
        return match; // Always preserve first mention
      }
      if (Math.random() < 0.6) {
        replacementsApplied++;
        return PERSON_DESCRIPTORS[Math.floor(Math.random() * PERSON_DESCRIPTORS.length)];
      }
      return match;
    });
  }

  // ── Places ──
  const places = doc.places().out('array');
  const uniquePlaces = [...new Set(places.map(p => p.trim()).filter(p => p.length > 2))];

  for (const place of uniquePlaces) {
    if (protectedSet.has(place.toLowerCase())) continue;

    const regex = new RegExp(escapeRegex(place), 'g');
    const occurrences = (result.match(regex) || []).length;

    if (occurrences <= 1) continue;

    let firstSkipped = false;
    result = result.replace(regex, (match) => {
      if (!firstSkipped) {
        firstSkipped = true;
        return match;
      }
      if (Math.random() < 0.5) {
        replacementsApplied++;
        return PLACE_DESCRIPTORS[Math.floor(Math.random() * PLACE_DESCRIPTORS.length)];
      }
      return match;
    });
  }

  // ── Organizations ──
  const orgs = doc.organizations().out('array');
  const uniqueOrgs = [...new Set(orgs.map(o => o.trim()).filter(o => o.length > 2))];

  for (const org of uniqueOrgs) {
    if (protectedSet.has(org.toLowerCase())) continue;

    const regex = new RegExp(escapeRegex(org), 'g');
    const occurrences = (result.match(regex) || []).length;

    if (occurrences <= 1) continue;

    let firstSkipped = false;
    result = result.replace(regex, (match) => {
      if (!firstSkipped) {
        firstSkipped = true;
        return match;
      }
      if (Math.random() < 0.4) {
        replacementsApplied++;
        return ORG_DESCRIPTORS[Math.floor(Math.random() * ORG_DESCRIPTORS.length)];
      }
      return match;
    });
  }

  return { text: result, replacements: replacementsApplied };
}

// ─── Pipeline Stage ────────────────────────────────────────────────

const entityVariation = {
  name: 'entityVariation',

  async execute(ctx) {
    const chunks = ctx.rewrittenChunks || [];
    if (chunks.length === 0) {
      Logger.warn(this.name, 'No rewritten chunks to process');
      return;
    }

    const protectedSet = buildProtectedSet(ctx.analysis);
    let totalReplacements = 0;

    const processedChunks = chunks.map((chunk, i) => {
      const { text, replacements } = applyEntityVariation(chunk, protectedSet);
      totalReplacements += replacements;
      return text;
    });

    ctx.rewrittenChunks = processedChunks;

    Logger.info(this.name, `Entity variation complete`, {
      chunks: chunks.length,
      replacements: totalReplacements,
    });
  },
};

module.exports = entityVariation;
