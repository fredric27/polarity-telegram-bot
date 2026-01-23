require('dotenv').config();
const OpenAI = require('openai');
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");
const fs = require("fs");
require('dotenv').config();



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    const MySchema = z.object({
        departureStation: z.string(),
        destinationStation: z.string(),
        departureTimestamp: z.string(),
    });

    const completion = await openai.chat.completions.parse({
        model: "gpt-5-nano",
        messages: [
    {
        role: "system",
        content: `
            Rispondi SOLO con JSON valido.
            Estrai esclusivamente:
            - departureStation
            - destinationStation

            Usa esattamente i nomi delle città italiane così come compaiono nel messaggio.
            Non aggiungere timestamp, non aggiungere altri campi.
            Non aggiungere testo fuori dal JSON.
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

        return transcription.text;
}


// Esporta le funzioni
module.exports = {
    answer,
    structuredAnswer,
    voiceTranscription,
    openai
};


