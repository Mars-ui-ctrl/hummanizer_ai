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
    subtitle: 'Single Pass',
    description:
      'A single-pass rewrite focused on clarity, grammar, and readability.',
    path: '/method1',
    endpoint: '/method1',
    icon: '⚡',
  },
  {
    id: 2,
    name: 'Method 2',
    subtitle: 'Two Pass',
    description:
      'Rewrite then review — two AI passes for improved consistency and flow.',
    path: '/method2',
    endpoint: '/method2',
    icon: '🔄',
  },
  {
    id: 3,
    name: 'Method 3',
    subtitle: 'Context-Aware',
    description:
      'Document-level rewrite improving transitions and paragraph coherence.',
    path: '/method3',
    endpoint: '/method3',
    icon: '🧠',
  },
  {
    id: 4,
    name: 'Method 4',
    subtitle: 'Clean & Rewrite',
    description:
      'Pre-cleans formatting and punctuation, then rewrites with AI.',
    path: '/method4',
    endpoint: '/method4',
    icon: '✨',
  },
  {
    id: 5,
    name: 'Method 5',
    subtitle: 'Best of Three',
    description:
      'Generates three versions and automatically selects the highest quality result.',
    path: '/method5',
    endpoint: '/method5',
    icon: '🏆',
  },
];

export default methods;
