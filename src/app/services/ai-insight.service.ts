import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { catchError, from, map, of, switchMap, take } from 'rxjs';
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
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private baseUrl = 'https://rawg-proxy.sparkling-math-dc03.workers.dev';
  private model = 'gpt-4.1-mini';
  private promptVersion = 'v2';

  getInsight(payload: AiInsightRequest) {
    return authState(this.auth).pipe(
      take(1),
      switchMap(snapshot => {
        const uid = snapshot?.uid;
        if (!uid) {
          return this.requestInsight(payload);
        }

        const ref = doc(this.firestore, `users/${uid}/ai_insights/${payload.gameId}`);
        return from(getDoc(ref)).pipe(
          catchError(() => of(null)),
          switchMap(insight => {
            if (insight?.exists()) {
              return of(insight.data() as AiInsight);
            }

            return this.requestInsight(payload).pipe(
              switchMap(result => {
                const record = {
                  gameId: payload.gameId,
                  gameName: payload.gameName,
                  generatedAt: serverTimestamp(),
                  model: this.model,
                  promptVersion: this.promptVersion,
                  ...result
                };
                return from(setDoc(ref, record)).pipe(
                  map(() => result),
                  catchError(() => of(result))
                );
              })
            );
          })
        );
      })
    );
  }

  private requestInsight(payload: AiInsightRequest) {
    return this.http.post<AiInsight>(`${this.baseUrl}/ai/insight`, payload);
  }
}
