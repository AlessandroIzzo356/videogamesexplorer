import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, deleteDoc, doc, orderBy, query, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { RawgGame } from '../models/rawg';
import { Observable, firstValueFrom, map, of, switchMap, take } from 'rxjs';

interface BacklogEntry {
  game: RawgGame;
  createdAt: unknown;
}

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async addToBacklog(game: RawgGame) {
    const user = await firstValueFrom(authState(this.auth).pipe(take(1)));
    const uid = user?.uid;
    console.log('[backlog] uid', uid);
    if (!uid) {
      throw new Error('User not authenticated');
    }

    try {
      const ref = doc(this.firestore, `users/${uid}/backlog/${game.id}`);
      console.log('[backlog] ref', ref.path);
      const payload: BacklogEntry = {
        game,
        createdAt: serverTimestamp()
      };

      await setDoc(ref, payload, { merge: true });
      console.log('[backlog] saved', { uid, gameId: game.id });
    } catch (error) {
      console.error('[backlog] save failed', error);
      throw error;
    }
  }

  async removeFromBacklog(gameId: number) {
    const user = await firstValueFrom(authState(this.auth).pipe(take(1)));
    const uid = user?.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    const ref = doc(this.firestore, `users/${uid}/backlog/${gameId}`);
    await deleteDoc(ref);
  }

  backlog$(): Observable<RawgGame[]> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        const ref = collection(this.firestore, `users/${user.uid}/backlog`);
        const ordered = query(ref, orderBy('createdAt', 'desc'));
        return collectionData(ordered) as Observable<BacklogEntry[]>;
      }),
      map(entries => entries.map(entry => entry.game))
    );
  }
}
