const path = require("path");
const axios = require("axios");
const ai = require("./ai")
const fs = require("fs");
const { getSolutionsByJSON } = require('./trenitalia.js')
require("dotenv").config()


const { Telegraf, Markup } = require("telegraf")
const { message } = require("telegraf/filters");


if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Please provide a valid Telegram Bot Token.")
    process.exit(1)
}

console.log("Token caricato:")
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.start(async (ctx) => {
    await ctx.reply("Ciao! Sono qui per aiutarti a trovare il treno perfetto. Scrivimi da dove parti, dove vuoi andare e quando. Penso io a cercare tutte le opzioni Trenitalia più comode per te.")
})

bot.on(message("text"), async (ctx) => {
    const message = ctx.message.text
    startSearching(ctx, message);
})

bot.on("voice", async (ctx) => {
  const voice = ctx.message.voice;
  const fileId = voice.file_id;


    const url = (await ctx.telegram.getFileLink(fileId)).href;


  const tmpPath = path.join(
    "/tmp",
    `voice_${voice.file_unique_id}.ogg`
  );


  try {

    const res = await axios.get(url, { responseType: "stream" });
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(tmpPath);
      res.data.pipe(w);
      w.on("finish", resolve);
      w.on("error", reject);

    });

    const transcription = await ai.voiceTranscription(tmpPath);
    startSearching(ctx, transcription);

  } catch (err) {
    console.error(err);
    await ctx.reply("Errore nella trascrizione.");
  } finally {

    fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath);
  }
});

async function startSearching(ctx, message) {
    console.log("start searching");
    const json = await ai.structuredAnswer(message);

    if (!json || !json.departureStation || !json.destinationStation)
      {
          console.log('notclear')
          await ctx.reply(await ai.answerNotClear(message));
          return;
      }

    const { departureStation, destinationStation, departureTimestamp } = json;

    const solutions = await getSolutionsByJSON(
        departureStation,
        destinationStation,
        departureTimestamp
    );

    if (solutions === -1) {
      console.log("Stazione non trovata");
      return ctx.reply("Non ho trovato una delle stazioni. Puoi ripetere meglio?");
    }


    console.log("Solutions trovate:", solutions);

    const slimSolutions = solutions.map(s => ({
        origin: s.origin,
        destination: s.destination,
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        duration: s.duration,
        price: s.price,
        name: s.name,
        acronym: s.acronym
    }));

    const best = await ai.getSolutionByAi(message, slimSolutions);
    if(!best){
      return ctx.reply("Non sono riuscito a trovare una soluzione.");
    }

    console.log(best)
    await ctx.reply(ai.formatSolution(best));
    sendCalendarFile(ctx, best);

}



function sendCalendarFile(ctx, solution) {
  const title = `VIAGGIO: ${solution.origin} → ${solution.destination} | ${solution.name}`;
  const details = `Partenza: ${solution.departureTime}\nArrivo: ${solution.arrivalTime}`;
  const location = solution.origin;

  const dates = `${isoToICS(solution.departureTime)}/${isoToICS(solution.arrivalTime)}`;

  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    `&dates=${dates}`;

  return ctx.reply(
    '↓',
    Markup.inlineKeyboard([
      Markup.button.url('📅 Aggiungi al calendario', url)
    ])
  );
}


function isoToICS(isoString) {
  const date = new Date(isoString);

  const pad = (n) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
bot.launch()
/*     const sent = await ctx.reply('...');

    for await (const event of stream) {
        setTimeout(() => {
        ctx.telegram.editMessageText(
        ctx.chat.id,                    // chat_id
        sent.message_id,                // message_id
        undefined,                      // inline_message_id (non serve qui)
        sent.content + event            // nuovo testo del messaggio
        );
    }, 100);
    } */
