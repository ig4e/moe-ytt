import { config } from "dotenv";
import { Input, Markup, Telegraf } from "telegraf";
import { fmt, link } from "telegraf/format";
import { generateVideoURL, getLatestVideo, getVideo } from "./utils";

config();

const client = new Telegraf(process.env.BOT_TOKEN!);
const channelIDs = ["UCspaL6aZFjs5ChH0eaiakpw", "UC1bacrDsGPF_9LGfXPgEW-Q", "UCOghQW-IaXHoGphX0M3ZmWw"];

client.start((ctx) => {
	const commands = Markup.keyboard(["/ping", "/get_latest", "/download_latest"]).resize().oneTime();

	return ctx.reply("Welcome", commands);
});

client.command("ping", (ctx) => {
	ctx.reply("Pong!");
});

client.command("get_latest", async (ctx) => {
	channelIDs.map(async (channelId) => {
		const video = await getLatestVideo(channelId);

		const buttons = Markup.inlineKeyboard([Markup.button.callback(`Download ${video.title}`, `videoId:${video.id}`)]);

		return ctx.sendMessage(fmt`${link(video.title, generateVideoURL(video.id))}`, buttons);
	});
});

client.action(/:(.+)/, async (ctx, next) => {
	try {
		const videoId = ctx.match[1];
		const { title, stream } = await getVideo(videoId);

		return ctx.replyWithAudio(Input.fromReadableStream(stream, title));
	} catch {
		return ctx.reply("Error");
	}
});

launch();

// Enable graceful stop
process.once("SIGINT", () => client.stop("SIGINT"));
process.once("SIGTERM", () => client.stop("SIGTERM"));

function launch() {
	console.log(`MoeYTT is starting...`);
	client.launch();
}
