/**
 * Tronque un texte en ajoutant une ellipse à la fin.
 * @param text Le texte à tronquer
 * @param maxLength La longueur maximale du texte
 * @returns Le texte tronqué
 */
export default function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
}
