import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RawgGameDetail, RawgGamesResponse } from '../models/rawg';

@Injectable({ providedIn: 'root' })
export class RawgService {
  private http = inject(HttpClient);
  private baseUrl = 'https://api.rawg.io/api';
  private apiKey = environment.rawgApiKey;

  searchGames(query: string, pageSize = 10) {
    return this.http.get<RawgGamesResponse>(`${this.baseUrl}/games`, {
      params: {
        key: this.apiKey,
        search: query,
        page_size: pageSize
      }
    });
  }

  getGameDetail(id: string) {
    return this.http.get<RawgGameDetail>(`${this.baseUrl}/games/${id}`, {
      params: {
        key: this.apiKey
      }
    });
  }
}
