import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RawgGameDetail, RawgGamesResponse } from '../models/rawg';

@Injectable({ providedIn: 'root' })
export class RawgService {
  private http = inject(HttpClient);
  private baseUrl = 'https://rawg-proxy.sparkling-math-dc03.workers.dev';

  searchGames(query: string, pageSize = 10) {
    return this.http.get<RawgGamesResponse>(`${this.baseUrl}/rawg/search`, {
      params: {
        q: query,
        page_size: pageSize
      }
    });
  }

  getGameDetail(id: string) {
    return this.http.get<RawgGameDetail>(`${this.baseUrl}/rawg/game/${id}`);
  }

  getGameSeries(id: string, name?: string) {
    const params = name ? { name } : undefined;
    return this.http.get<{ franchise: string | null }>(`${this.baseUrl}/rawg/game/${id}/series`, { params });
  }
}
