// Importa la libreria OpenAI
const OpenAI = require('openai');
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");
const fs = require("fs");
require('dotenv').config();

// Inizializza il client OpenAI con la tua API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Funzione per inviare una richiesta a ChatGPT
async function answer(userMessage) {
    try {
        const response = await openai.responses.create({
            model: 'gpt-5-nano',
            instructions: 'You\'re a travel assistant, useful to find the best solutions for train travels in Italy. Always answer in Italian. Tell the user that you\'re searching for the best solutions being calm and telling him he just need to wait.',
            input: userMessage
        });


        return response.output_text;
    } catch (error) {
        console.error('Errore nella richiesta OpenAI:', error);
        throw error;
    }
}

async function structuredAnswer(userMessage) {
    // Definisci lo schema Zod
    const MySchema = z.object({
        departureStation: z.string(),
        destinationStation: z.string(),
        departureTimestamp: z.string(),
    });

    const completion = await openai.chat.completions.parse({
        model: "gpt-5-nano", // o versioni successive
        messages: [
            { role: "system", content: "Extract the required information and put it in the schema. Remember that these are italian words and city names. the departureTimestamp should be in ISO 8601 format. (date and time) example: 2026-01-22T16:58:00.000+01:00. Use the italian time zone" },
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

        return transcription.text;
}


// Esporta le funzioni
module.exports = {
    answer,
    structuredAnswer,
    voiceTranscription,
    openai
};


