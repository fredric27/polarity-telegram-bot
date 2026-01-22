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
    await ctx.reply(`Cooosaaa: ${message}???`)
})

bot.launch()
