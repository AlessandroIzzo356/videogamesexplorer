import { AiInsight } from '../models/ai-insight';
import { RawgGame, RawgGameDetail } from '../models/rawg';

export function difficultyLabel(value?: AiInsight['difficolta']) {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) {
    return 'N/D';
  }
  if (normalized.includes('facile') || normalized.includes('easy')) {
    return 'Facile';
  }
  if (normalized.includes('media') || normalized.includes('medium')) {
    return 'Media';
  }
  if (normalized.includes('difficile') || normalized.includes('hard')) {
    return 'Difficile';
  }
  if (normalized.includes('punitivo') || normalized.includes('punitive')) {
    return 'Punitivo';
  }
  return value;
}

export function ratingStars(rating?: number | null) {
  const safeRating = Math.max(0, Math.min(5, rating ?? 0));
  const fullStars = Math.floor(safeRating);
  const fraction = safeRating - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const extraFull = fraction >= 0.75 ? 1 : 0;
  const totalFull = Math.min(5, fullStars + extraFull);
  const stars: Array<'full' | 'half' | 'empty'> = [];

  for (let i = 0; i < totalFull; i += 1) {
    stars.push('full');
  }
  if (stars.length < 5 && hasHalf) {
    stars.push('half');
  }
  while (stars.length < 5) {
    stars.push('empty');
  }
  return stars;
}

type CompanySource = Pick<RawgGameDetail, 'developers' | 'publishers'> | Pick<RawgGame, 'developers' | 'publishers'> | null;

export function companyNames(game: CompanySource) {
  if (!game) {
    return [];
  }
  const developer = game.developers?.[0]?.name?.trim();
  const publisher = game.publishers?.[0]?.name?.trim();
  if (developer && publisher) {
    if (developer.toLowerCase() === publisher.toLowerCase()) {
      return [developer];
    }
    return [developer, publisher];
  }
  if (developer) {
    return [developer];
  }
  if (publisher) {
    return [publisher];
  }
  return [];
}

export function formatReason(value?: string) {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}
