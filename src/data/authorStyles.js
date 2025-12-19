/**
 * Author Styles Module
 * Ported from iOS Loomiverse app's AuthorStyles.json
 *
 * Provides rich writing style guidance for AI story generation
 */

import authorStylesData from './AuthorStyles.json';

/**
 * Get all available style categories
 */
export function getStyleCategories() {
  return authorStylesData.map(style => style.style);
}

/**
 * Get authors for a specific style/genre
 */
export function getAuthorsForStyle(styleName) {
  const style = authorStylesData.find(s =>
    s.style.toLowerCase() === styleName.toLowerCase()
  );
  return style?.authors || [];
}

/**
 * Get a random author for a given genre
 */
export function getRandomAuthorForGenre(genreName) {
  // Map genre names to style names
  const genreToStyleMap = {
    'fantasy': 'Fantasy',
    'epic fantasy': 'Fantasy',
    'dark fantasy': 'Dark Fantasy Story',
    'scifi': 'Sci-Fi',
    'science fiction': 'Sci-Fi',
    'cyberpunk': 'Cyberpunk Tale',
    '70s sci-fi': '70s Sci-Fi',
    'mystery': 'Mystery',
    'mystery thriller': 'Mystery',
    'thriller': 'Thriller',
    'romance': 'Romance',
    'romantic comedy': 'Romantic Comedy',
    'horror': 'Horror',
    'gothic': 'Gothic',
    'literary': 'Literary Fiction',
    'literary fiction': 'Literary Fiction',
    'young adult': 'Young Adult',
    'ya': 'Young Adult',
    'historical fiction': 'Historical Fiction',
    'historical': 'Historical Fiction',
    'crime': 'Crime',
    'noir': 'Noir Crime Thriller',
    'adventure': 'Adventure',
    'action': 'Action',
    'dystopian': 'Dystopian',
    'paranormal': 'Paranormal',
    'western': 'Western',
    'satire': 'Satire',
    'magic realism': 'Magic Realism',
    'graphic novel': 'Graphic Novel',
    'biography': 'Biography/Autobiography',
    'standup': 'Stand Up Comedy (in first person pov and style of Nate Bargatze)',
    'comedy': 'Stand Up Comedy (in first person pov and style of Nate Bargatze)'
  };

  const styleName = genreToStyleMap[genreName.toLowerCase()] || genreName;
  const authors = getAuthorsForStyle(styleName);

  // Filter to authors with descriptions (more useful for prompts)
  const authorsWithDescriptions = authors.filter(a => a.description);

  if (authorsWithDescriptions.length > 0) {
    return authorsWithDescriptions[Math.floor(Math.random() * authorsWithDescriptions.length)];
  }

  // Fallback to Universal House Rules if no specific authors
  const universalStyle = authorStylesData.find(s => s.style === 'Universal House Rules');
  if (universalStyle?.authors?.length > 0) {
    return universalStyle.authors[0];
  }

  return null;
}

/**
 * Get universal storytelling rules (The Abercrombie Method)
 * These apply to ALL stories regardless of genre
 */
export function getUniversalRules() {
  const universalStyle = authorStylesData.find(s => s.style === 'Universal House Rules');
  if (universalStyle?.authors?.length > 0) {
    return universalStyle.authors[0].description;
  }
  return '';
}

/**
 * Build a complete author style prompt for story generation
 */
export function buildAuthorStylePrompt(genreName, authorOverride = null) {
  const author = authorOverride || getRandomAuthorForGenre(genreName);
  const universalRules = getUniversalRules();

  if (!author) {
    return universalRules ? `\n\nSTYLE GUIDANCE:\n${universalRules}` : '';
  }

  let prompt = '\n\n═══════════════════════════════════════════════════';
  prompt += '\nWRITING STYLE GUIDANCE';
  prompt += '\n═══════════════════════════════════════════════════';

  if (universalRules) {
    prompt += `\n\nUNIVERSAL RULES:\n${universalRules}`;
  }

  prompt += `\n\nAUTHOR INSPIRATION: ${author.name}`;
  if (author.description) {
    prompt += `\n${author.description}`;
  }

  prompt += '\n═══════════════════════════════════════════════════\n';

  return prompt;
}

/**
 * Export the raw data for direct access if needed
 */
export const rawAuthorStyles = authorStylesData;

export default {
  getStyleCategories,
  getAuthorsForStyle,
  getRandomAuthorForGenre,
  getUniversalRules,
  buildAuthorStylePrompt,
  rawAuthorStyles
};
