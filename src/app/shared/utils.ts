import { RawgGame, RawgGameDetail } from '../models/rawg';

export interface PlatformIcon {
  key: 'playstation' | 'xbox' | 'pc' | 'nintendo';
  label: string;
  path?: string;
}

export function formatDate(value: string | null) {
  if (!value) {
    return 'N/D';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function stars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => index < filled);
}

export function platformIcons(game: RawgGame): PlatformIcon[] {
  const icons = new Set<PlatformIcon['key']>();
  const platforms = game.parent_platforms && game.parent_platforms.length
    ? game.parent_platforms
    : game.platforms;

  for (const entry of platforms ?? []) {
    const slug = entry.platform.slug;
    if (slug.startsWith('playstation')) {
      icons.add('playstation');
    } else if (slug.startsWith('xbox')) {
      icons.add('xbox');
    } else if (slug === 'pc' || slug === 'mac' || slug === 'linux') {
      icons.add('pc');
    } else if (slug.includes('nintendo') || slug.includes('switch')) {
      icons.add('nintendo');
    }
  }

  const allIcons: PlatformIcon[] = [
    { key: 'playstation', label: 'PlayStation', path: 'M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z' },
    { key: 'xbox', label: 'Xbox', path: 'M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z' },
    { key: 'pc', label: 'Steam', path: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z' },
    { key: 'nintendo', label: 'Nintendo' }
  ];

  return allIcons.filter(icon => icons.has(icon.key));
}

export function genreNames(game: RawgGameDetail, limit = 3) {
  if (!game.genres?.length) {
    return 'N/D';
  }
  return game.genres.slice(0, limit).map(genre => genre.name).join(', ');
}

export function gameModes(game: RawgGameDetail) {
  const tags = game.tags ?? [];
  const modes: string[] = [];

  const has = (slug: string) => tags.some(tag => tag.slug === slug);

  if (has('singleplayer')) {
    modes.push('Single Player');
  }
  if (has('co-op') || has('online-co-op') || has('local-co-op')) {
    modes.push('Coop');
  }
  if (has('multiplayer') || has('pvp')) {
    modes.push('Multiplayer');
  }

  return modes.length ? modes.join(' / ') : 'N/D';
}
