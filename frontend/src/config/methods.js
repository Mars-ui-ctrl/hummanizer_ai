/**
 * Methods Configuration
 *
 * Central config for all rewrite methods. Add new methods here
 * and they will automatically appear in the sidebar and routing.
 */
const methods = [
  {
    id: 1,
    name: 'Method 1',
    subtitle: 'Quick Rewrite',
    description:
      'Analysis → Rewrite → Validation. Fast full-sentence rewrite with quality checks.',
    path: '/method1',
    endpoint: '/method1',
    icon: '⚡',
  },
  {
    id: 2,
    name: 'Method 2',
    subtitle: 'Structural Rewrite',
    description:
      'Restructures sentences and paragraphs programmatically before AI rewrite and validation.',
    path: '/method2',
    endpoint: '/method2',
    icon: '🔄',
  },
  {
    id: 3,
    name: 'Method 3',
    subtitle: 'Lexical + Style',
    description:
      'Applies lexical diversification and structural transformation before rewrite, then refines style.',
    path: '/method3',
    endpoint: '/method3',
    icon: '🧠',
  },
  {
    id: 4,
    name: 'Method 4',
    subtitle: 'Style + Diversity',
    description:
      'Full structural, rewrite, style refinement, and diversity passes for maximum writing variation.',
    path: '/method4',
    endpoint: '/method4',
    icon: '✨',
  },
  {
    id: 5,
    name: 'Method 5',
    subtitle: 'Full Pipeline',
    description:
      'Complete 8-stage pipeline: analysis, structure, lexical, rewrite, style, diversity, polish, and validation.',
    path: '/method5',
    endpoint: '/method5',
    icon: '🏆',
  },
];

export default methods;
