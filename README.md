<h1>Polarity Telegram Bot — Trenitalia Travel Finder</h1>

Bot Telegram scritto in Node.js che interpreta messaggi testuali/voce, individua la miglior soluzione di viaggio tramite le API pubbliche di Trenitalia (lefrecce.it) e restituisce l’opzione più adatta in base alla richiesta dell’utente.

<h2>✅ Funzionalità principali</h2>

*   Parsing intelligente del messaggio con OpenAI per estrarre:

    *   stazione di partenza

    *   stazione di arrivo

    *   data/ora di partenza

*   Ricerca soluzioni Trenitalia via API pubbliche

*   Selezione della soluzione migliore con LLM (prezzo/rapidità/diretta)

*   Supporto messaggi vocali (trascrizione)

*   Link calendario per aggiungere il viaggio a Google Calendar


<h2>🧩 Architettura (file principali)</h2>

*   index.js: entry point del bot Telegram (Telegraf)

*   ai.js: logica OpenAI (parsing, best-solution, trascrizione)

*   trenitalia.js: chiamate HTTP alle API di Trenitalia

*   package.json: dipendenze e script


<h2>🔐 Variabili d’ambiente richieste</h2>

Crea un file .env nella root del progetto:

TELEGRAM\_BOT\_TOKEN=...

OPENAI\_API\_KEY=...

<h2>🚀 Avvio del bot</h2>

npm install

node index.js

In alternativa: npm run dev (usa nodemon).

<h2>🧠 Come funziona (flow)</h2>

1.  L’utente invia testo o voce al bot.

2.  Il messaggio viene trasformato in JSON tramite OpenAI:

    *   departureStation

    *   destinationStation

    *   departureTimestamp

3.  Il bot interroga Trenitalia con trenitalia.js.

4.  Le soluzioni vengono filtrate e passate a OpenAI per scegliere la migliore.

5.  Il bot risponde con:

    *   dettagli del viaggio

    *   pulsante “Aggiungi al calendario”


<h2>🔊 Input supportati</h2>

*   Testo naturale (es. “Da Milano a Roma domani mattina”)

*   Messaggi vocali (trascritti via OpenAI)


<h2>📅 Calendario</h2>

Alla fine della risposta, il bot genera un link Google Calendar con:

*   origine/destinazione

*   orari

*   nome treno


<h2>📦 Dipendenze principali</h2>

*   telegraf

*   axios

*   openai

*   zod

*   dotenv
