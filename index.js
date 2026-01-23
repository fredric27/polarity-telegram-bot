const ai = require("./ai")
require("dotenv").config()


const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")

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
    await ctx.reply(await ai.answer(message))
    await ctx.reply(JSON.stringify(await ai.structuredAnswer(message)))
})

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