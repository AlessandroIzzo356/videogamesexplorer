import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, deleteDoc, doc, orderBy, query, serverTimestamp, setDoc, writeBatch } from '@angular/fire/firestore';
import { RawgGame } from '../models/rawg';
import { Observable, firstValueFrom, map, of, switchMap, take } from 'rxjs';

interface BacklogEntry {
  game: RawgGame;
  createdAt: unknown;
  order?: number;
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
        createdAt: serverTimestamp(),
        order: Date.now()
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
      map(entries => {
        const withIndex = entries.map((entry, index) => ({ entry, index }));
        withIndex.sort((left, right) => {
          const leftOrder = typeof left.entry.order === 'number' ? left.entry.order : null;
          const rightOrder = typeof right.entry.order === 'number' ? right.entry.order : null;
          if (leftOrder !== null && rightOrder !== null) {
            return leftOrder - rightOrder;
          }
          if (leftOrder !== null) {
            return -1;
          }
          if (rightOrder !== null) {
            return 1;
          }
          return left.index - right.index;
        });
        return withIndex.map(item => item.entry.game);
      })
    );
  }

  async updateOrder(orderedGames: RawgGame[]) {
    if (!orderedGames.length) {
      return;
    }
    const user = await firstValueFrom(authState(this.auth).pipe(take(1)));
    const uid = user?.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    const batch = writeBatch(this.firestore);
    orderedGames.forEach((game, index) => {
      const ref = doc(this.firestore, `users/${uid}/backlog/${game.id}`);
      batch.update(ref, { order: index });
    });
    await batch.commit();
  }
}
