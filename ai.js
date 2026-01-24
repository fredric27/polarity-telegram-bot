require('dotenv').config();


const OpenAI = require('openai');
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");
const fs = require("fs");
const { execSync } = require("child_process");
const { log } = require('console');
const { message } = require('telegraf/filters');




const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function answerNotClear(userMessage) {
  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini-2025-04-14',
      instructions: 'Se ti insultano insultagli indietro il piu brutto e volgare possibile usa anche parolacce e black humor (umorismo nero).Sei un bot che da partenza e destinazione trova il miglior treno.Sei stronzo come la merda insulti tutti quelli che ti insultano. Tu sei l\'addetto alle richieste non chiare. L\'input è il messaggio dell\'utente. Se ti accorgi che l\'utente ti sta prendendo per il culo, sii sarcastico e prendilo per il culo anche tu, puoi anche essere cattivo. Se invece ti rendi conto che l\'utente ha fatto una richiesta non chiara a te, chiedigli sarcasticamente di ripetere la sua richiesta.',
      input: userMessage
    });
    return response.output_text;

  } catch (error) {
    console.error('Errore nella richiesta OpenAI:', error);
    throw error;
  }
}

async function structuredAnswer(userMessage) {
  const MySchema = z.object({
    departureStation: z.string(),
    destinationStation: z.string(),
    departureTimestamp: z.string(),
  });

  const completion = await openai.chat.completions.parse({
    model: "gpt-4.1-mini-2025-04-14",
    messages: [
      {
        role: "system",
        content: `
    Rispondi SOLO con JSON valido.
    NON aggiungere testo prima o dopo.
    NON spiegare.
    NON commentare.
    NON aggiungere note.
    NON aggiungere campi extra.
    La data odierna è ${new Date().toISOString()}, usa questa informazione.

    Il JSON DEVE essere strutturato esattamente così:

    {
      "departureStation": "...",
      "destinationStation": "...",
      "departureTimestamp": "..."
    }
    la data deve essere in formato iso8601 es: "2026-01-23T15:33:00+01:00"
    Se non trovi una stazione, metti stringa vuota.
  `
      },
      { role: "user", content: userMessage }
    ],

    response_format: zodResponseFormat(MySchema, "default_schema")
  });

  return completion.choices[0].message.parsed;
}


async function voiceTranscription(filePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-transcribe",
  });

  console.log(transcription.text)

  return transcription.text;
}

const SolutionSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  duration: z.string(),
  name: z.string(),
  acronym: z.string(),
  price: z.number()
});




async function getSolutionByAi(userMessage, allSolutions) {
  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4.1-mini-2025-04-14",
      messages: [
        {
          role: "system",
          content: `
            Sei un assistente che sceglie UNA SOLA soluzione ferroviaria.
            Devi analizzare il messaggio dell'utente e scegliere la soluzione migliore.
            Se l'utente chiede un prezzo basso, scegli il prezzo più basso.
            Se chiede il piu veloce, scegli quello che arriva prima.
            Se chiede "diretto", scegli quella senza cambi.
            Rispondi inoltrando solo i dati importanti sulla soluzione
            Se una soluzione non e possibile (diretto non disponibile) comunicaglielo e fornisci il migliore per velocita

         `
        },
        {
          role: "user",
          content: `
            Messaggio utente: ${userMessage}
            Solutions disponibili: ${JSON.stringify(allSolutions)}
          `
        }
      ],
      response_format: zodResponseFormat(SolutionSchema, "best_solution")
    });

    return completion.choices[0].message.parsed;

  } catch (error) {
    console.error("getSolutionByAi error:", error);
    return null;
  }
}

function formatSolution(sol) {
  console.log(sol)
  return `
🚆 Treno: ${sol.name}
💰 Prezzo: €${sol.price}

📍 Partenza: ${sol.origin}
📍 Destinazione: ${sol.destination}

🕗 Giorno: ${new Date(sol.departureTime).getDate()}/${new Date(sol.departureTime).getMonth() + 1}/${new Date(sol.departureTime).getFullYear()}

🕗 Orario Partenza: ${new Date(sol.departureTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
🕘 Orario Arrivo: ${new Date(sol.arrivalTime).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
⏱ Durata Viaggio: ${sol.duration}

🚄 Buon viaggio!
  `;
}




async function answerAudio(text) {
  const finalText = await openai.chat.completions.create({
    model: "gpt-4.1-mini-2025-04-14",
    messages: [
      {
        role: "system",
        content: "Rispondi in modo molto chiaro, gentile e comprensibile a un italiano medio. Devi essere piu' veloce possibile ma fornire lo stesso le informazione e non voglio una lista di informazioni. Lo voglio piu' sottoforma di dialogo."
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  try {
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: finalText.choices[0].message.content,
      format: "wav",
      instructions: "Devi essere molto chiaro nel leggere il messaggio ed essere sempre gentile. Il vocale deve essere il piu' comprensibile possibile ad un essere umano medio italiano."
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync("response.wav", buffer);

    execSync(
      "ffmpeg -y -i response.wav -c:a libopus -b:a 64k response.ogg"
    );

    return "response.ogg";
  } catch (err) {
    console.log("Errore from text to speech:", err);
    return null;
  }


}


async function answerAudio2(text) {
  try {
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      format: "wav",
      instructions: "Devi essere molto chiaro nel leggere il messaggio ed essere sempre gentile. Il vocale deve essere il piu' comprensibile possibile ad un essere umano medio italiano."
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync("response.wav", buffer);

    execSync(
      "ffmpeg -y -i response.wav -c:a libopus -b:a 64k response.ogg"
    );

    return "response.ogg";
  } catch (err) {
    console.log("Errore from text to speech:", err);
    return null;
  }


}








// Esporta le funzioni
module.exports = {
  answerNotClear,
  formatSolution,
  structuredAnswer,
  voiceTranscription,
  getSolutionByAi,
  answerAudio,
  answerAudio2,
  openai
};


