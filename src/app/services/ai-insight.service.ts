import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AiInsight } from '../models/ai-insight';

export type AiInsightRequest = {
  name: string;
  released?: string | null;
  genres?: string[] | null;
  platforms?: string[] | null;
  description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AiInsightService {
  private http = inject(HttpClient);
  private baseUrl = 'https://rawg-proxy.sparkling-math-dc03.workers.dev';

  getInsight(payload: AiInsightRequest) {
    return this.http.post<AiInsight>(`${this.baseUrl}/ai/insight`, payload);
  }
}
