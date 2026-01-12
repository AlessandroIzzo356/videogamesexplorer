export interface RawgGamesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

export interface RawgGameDetail extends RawgGame {
  description_raw?: string;
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
