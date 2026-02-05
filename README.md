# VideoGamesExplorer

App Angular per gestire il backlog videogiochi personale, cercare titoli da RAWG e ottenere insight AI in italiano.

Il focus del progetto non è solo la funzionalità, ma l’esplorazione di UX, micro-interazioni e decisioni di prodotto
che rendono un backlog più utile e motivante da usare nel tempo.

## Stack

- Angular 21 (standalone components)
- Firebase Auth + Firestore
- RAWG API (via Cloudflare Worker proxy)
- OpenAI Responses API (via Cloudflare Worker proxy)

## Funzionalita principali

- Registrazione, login e reset password
- Backlog personale con stati (`to_play`, `in_progress`, `completed`)
- Riordino backlog con persistenza ordine
- Ricerca giochi con filtro metacritic
- Dettaglio gioco + serie/franchise
- Insight AI salvati su Firestore per cache

## AI insights

Gli insight AI non vengono rigenerati a ogni richiesta:
- vengono generati una sola volta per gioco
- salvati su Firestore
- riutilizzati come dato persistente

L’obiettivo non è sostituire recensioni,
ma aiutare l’utente a capire se e quando un gioco fa per lui.

## Prerequisiti

- Node.js 20+
- npm 10+
- Angular CLI (opzionale, i comandi npm lo invocano gia)

## Avvio rapido (frontend)

```bash
npm install
npm start
```

App disponibile su `http://localhost:4200/`.

Comandi utili:

```bash
npm run build
npm run test
```

## Configurazione Firebase

La configurazione Firebase e in:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Verifica che il progetto Firebase abbia:

- Authentication abilitata (Email/Password)
- Firestore attivo

### Firestore Rules

Le regole sono definite in `firestore.rules` e collegate in `firebase.json`.

Deploy regole:

```bash
firebase deploy --only firestore:rules
```

Schema dati rilevante:

- `users/{uid}/backlog/{gameId}`: backlog privato (owner-only)
- `users/{uid}/ai_insights/{rawgId}`: cache insight AI per-utente (owner-only)
- `ai_insights/{rawgId}`: collezione globale lasciata in sola lettura client

### Security notes

- La cache AI e per-utente per evitare che client autenticati possano alterare insight condivisi globali.
- Le scritture sui dati utente sono consentite solo al proprietario (`request.auth.uid == userId`).
- E presente una regola `deny all` finale per bloccare ogni path non esplicitamente autorizzato.

## Backend proxy (Cloudflare Worker)

Cartella: `server/wrangler-proxy`

Serve per:

- proteggere chiavi API (`RAWG_API_KEY`, `OPENAI_API_KEY`)
- esporre endpoint:
  - `GET /rawg/search`
  - `GET /rawg/game/:id`
  - `GET /rawg/game/:id/series`
  - `POST /ai/insight`

### Avvio locale worker

```bash
cd server/wrangler-proxy
npm install
npm run dev
```

### Segreti richiesti

Imposta i secrets su Cloudflare (o in locale via wrangler):

```bash
wrangler secret put RAWG_API_KEY
wrangler secret put OPENAI_API_KEY
```

## Note importanti

- Il frontend usa attualmente una base URL hardcoded del worker deployato in:
  - `src/app/services/rawg.service.ts`
  - `src/app/services/ai-insight.service.ts`
- Se vuoi usare il worker locale, aggiorna temporaneamente `baseUrl` (es. `http://127.0.0.1:8787`).

## Struttura progetto

```text
src/app/features/        Pagine principali (backlog, search, auth, detail, tonight)
src/app/services/        Accesso dati (auth, firestore, rawg, ai)
src/app/shared/          Componenti riusabili (game-card, loading, suggestions)
server/wrangler-proxy/   Proxy RAWG + endpoint AI su Cloudflare Workers
```

## Stato del progetto

Work in progress.
Il progetto è in sviluppo attivo e alcune parti sono volutamente iterative
per sperimentare UX, flussi e scelte di prodotto.
