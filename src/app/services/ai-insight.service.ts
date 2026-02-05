import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { AiInsight } from '../models/ai-insight';

export type AiInsightRequest = {
  gameId: number;
  gameName: string;
  name: string;
  released?: string | null;
  genres?: string[] | null;
  platforms?: string[] | null;
  description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AiInsightService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private baseUrl = 'https://rawg-proxy.sparkling-math-dc03.workers.dev';
  private model = 'gpt-4.1-mini';
  private promptVersion = 'v2';

  getInsight(payload: AiInsightRequest) {
    const ref = doc(this.firestore, `ai_insights/${payload.gameId}`);
    return from(getDoc(ref)).pipe(
      catchError(() => of(null)),
      switchMap(snapshot => {
        if (snapshot?.exists()) {
          return of(snapshot.data() as AiInsight);
        }

        return this.http.post<AiInsight>(`${this.baseUrl}/ai/insight`, payload).pipe(
          switchMap(insight => {
            const record = {
              gameId: payload.gameId,
              gameName: payload.gameName,
              generatedAt: serverTimestamp(),
              model: this.model,
              promptVersion: this.promptVersion,
              ...insight
            };
            return from(setDoc(ref, record)).pipe(
              map(() => insight),
              catchError(() => of(insight))
            );
          })
        );
      })
    );
  }
}
