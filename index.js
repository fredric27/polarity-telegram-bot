const path = require("path");
const axios = require("axios");
const ai = require("./ai")
const fs = require("fs");
require("dotenv").config()


const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters");
const { start } = require("repl");

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Please provide a valid Telegram Bot Token.")
    process.exit(1)
}

console.log("Token caricato:", process.env.TELEGRAM_BOT_TOKEN)

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.start(async (ctx) => {
    await ctx.reply("Ciao")
})

bot.on(message("text"), async (ctx) => {
    const message = ctx.message.text
    startSearching(ctx, message);
})

bot.on("voice", async (ctx) => {
  const voice = ctx.message.voice;
  const fileId = voice.file_id;

  // ottieni link Telegram
    const url = (await ctx.telegram.getFileLink(fileId)).href;

  // percorso temporaneo
  const tmpPath = path.join(
    "/tmp",
    `voice_${voice.file_unique_id}.ogg`
  );


  try {
    // scarica il vocale
    const res = await axios.get(url, { responseType: "stream" });
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(tmpPath);
      res.data.pipe(w);
      w.on("finish", resolve);
      w.on("error", reject);

    });
    // trascrivi
    const transcription = await ai.voiceTranscription(tmpPath);


    // risposta
    startSearching(ctx, transcription);

  } catch (err) {
    console.error(err);
    await ctx.reply("Errore nella trascrizione.");
  } finally {
    // 6) cleanup
    fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath);
  }
});

async function startSearching(ctx, message){
    await ctx.reply(JSON.stringify(await ai.structuredAnswer(message)))
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