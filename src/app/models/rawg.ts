export interface RawgGamesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

export type BacklogStatus = 'to_play' | 'in_progress' | 'completed';

export interface RawgGameDetail extends RawgGame {
  description_raw?: string;
  developers?: RawgCompany[];
  publishers?: RawgCompany[];
}

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  playtime?: number;
  genres: RawgGenre[];
  tags?: RawgTag[];
  platforms: RawgPlatformWrapper[];
  parent_platforms?: RawgPlatformWrapper[];
  short_screenshots: RawgScreenshot[];
  developers?: RawgCompany[];
  publishers?: RawgCompany[];
  backlogStatus?: BacklogStatus;
}

export interface RawgGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RawgPlatformWrapper {
  platform: RawgPlatform;
}

export interface RawgPlatform {
  id: number;
  name: string;
  slug: string;
}

export interface RawgScreenshot {
  id: number;
  image: string;
}

export interface RawgTag {
  id: number;
  name: string;
  slug: string;
}

export interface RawgCompany {
  id: number;
  name: string;
  slug: string;
}
