import { config } from "dotenv";
import { Input, Markup, Telegraf } from "telegraf";
import { fmt, link } from "telegraf/format";
import { generateVideoURL, getLatestVideo, getVideo } from "./utils";
import { CronJob } from "cron";
import express from "express";
config();

const client = new Telegraf(process.env.BOT_TOKEN!);

const channelIDs = ["UCspaL6aZFjs5ChH0eaiakpw", "UC1bacrDsGPF_9LGfXPgEW-Q", "UCOghQW-IaXHoGphX0M3ZmWw"];
const chatIDs = [1885533743];

CronJob.from({
	cronTime: "0 0 * * *",
	onTick: async function () {
		channelIDs.map(async (channelId) => {
			const video = await getLatestVideo(channelId);
			const buttons = Markup.inlineKeyboard([Markup.button.callback(`Download ${video.title}`, `videoId:${video.id}`)]);

			return sendMessages(fmt`${link(video.title, generateVideoURL(video.id))}`, buttons);
		});

		console.log(`Sent latest videos to ${chatIDs.length} chat(s)`);
	},
	start: true,
	timeZone: "America/Los_Angeles",
});

client.start((ctx) => {
	const commands = Markup.keyboard(["/ping", "/get_latest"]).resize().oneTime();

	return ctx.reply("Welcome", commands);
});

client.command("ping", (ctx) => {
	ctx.reply(`Pong!, chatId: ${ctx.chat.id}`);
});

client.command("get_latest", async (ctx) => {
	channelIDs.map(async (channelId) => {
		const video = await getLatestVideo(channelId);
		const buttons = Markup.inlineKeyboard([Markup.button.callback(`Download ${video.title}`, `videoId:${video.id}`)]);

		return ctx.sendMessage(fmt`${link(video.title, generateVideoURL(video.id))}`, buttons);
	});
});

client.action(/:(.+)/, async (ctx) => {
	try {
		const videoId = ctx.match[1];
		const { title, stream } = await getVideo(videoId);

		return ctx.replyWithAudio(Input.fromReadableStream(stream, title));
	} catch {
		return ctx.reply("Error");
	}
});

function sendMessages(...props: any[]) {
	//@ts-expect-error
	return chatIDs.map((chatId) => client.telegram.sendMessage(chatId, ...props));
}

launch();

// Enable graceful stop
process.once("SIGINT", () => client.stop("SIGINT"));
process.once("SIGTERM", () => client.stop("SIGTERM"));

const app = express();

app.get("/", (req, res) => res.json({ message: "I'm better than god, I exist." }));
app.listen(process.env.PORT, () => console.log(`Server is running on port ${process.env.PORT}`));

function launch() {
	console.log(`MoeYTT is starting...`);
	client.launch();
}
