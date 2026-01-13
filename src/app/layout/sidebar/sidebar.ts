import { Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { Auth, authState } from "@angular/fire/auth";

@Component({
  selector: 'sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  standalone: true,
  styleUrl: './sidebar.css'
})

export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);
  private auth = inject(Auth);

  protected readonly isCollapsed = signal(false);
  protected readonly user = toSignal(authState(this.auth), { initialValue: null });

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  }
}
