import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmail(nickname: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: nickname });
    }
    return credential;
  }

  logout() {
    return signOut(this.auth);
  }

  getErrorMessage(error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : null;
    if (code) {
      switch (code) {
        case 'auth/invalid-email':
          return 'Email non valida.';
        case 'auth/invalid-credential':
          return 'Credenziali non valide.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Email o password errate.';
        case 'auth/email-already-in-use':
          return 'Email gia registrata.';
        case 'auth/weak-password':
          return 'La password e troppo debole.';
        case 'auth/network-request-failed':
          return 'Errore di rete. Riprova.';
        case 'auth/too-many-requests':
          return 'Troppi tentativi. Riprova piu tardi.';
        default:
          return 'Errore di autenticazione. Riprova.';
      }
    }
    return 'Errore di autenticazione. Riprova.';
  }
}
