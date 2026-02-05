export type Env = {
  RAWG_API_KEY: string;
  OPENAI_API_KEY: string;
};

export type RawgSeriesItem = {
  id: number;
  name: string;
  slug?: string;
  released?: string | null;
  background_image?: string | null;
};
