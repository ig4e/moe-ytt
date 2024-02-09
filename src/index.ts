import { config } from "dotenv";
config();

import { CronJob } from "cron";
import { eq } from "drizzle-orm";
import express from "express";
import { filesize } from "filesize";
import { Input, Markup, Telegraf } from "telegraf";
import { fmt, link } from "telegraf/format";
import { channelIDs, chatIDs } from "./config";
import { db } from "./db";
import { videos as videosTable } from "./db/schema";
import { generateVideoURL, getLatestVideo, getLatestVideos, getVideo } from "./utils";
const app = express();

const client = new Telegraf(process.env.BOT_TOKEN!);

const job = CronJob.from({
	cronTime: "0 * * * *",
	onTick: async function () {
		console.log(`[MoeYTT] Trying to send fetch & send latest videos`);

		const videos = await getLatestVideos();

		const sentVideos = (
			await Promise.all(
				videos.map(async (video) => {
					const isInDB = await db.query.videos.findFirst({
						where: eq(videosTable.id, video.id),
					});

					if (isInDB) {
						return false;
					} else {
						await db.insert(videosTable).values({ id: video.id, name: video.title });
					}

					const buttons = Markup.inlineKeyboard([Markup.button.callback(`Download ${video.title}`, `videoId:${video.id}`)]);
					sendMessages(fmt`${link(video.title, generateVideoURL(video.id))}`, buttons);
					return true;
				}),
			)
		).filter((result) => result === true);

		console.log(`[MoeYTT] Sent ${sentVideos.length} videos to ${chatIDs.length} chat(s)`);
	},
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
		const { title, stream, thumbnails, format } = await getVideo(videoId);

		const bitrateBps = format.bitrate! * (1000 / 1024);
		const durationSeconds = parseInt(format.approxDurationMs!) / 1000;
		const fileSizeBytes = (bitrateBps * durationSeconds) / 8;

		return ctx.replyWithAudio(Input.fromReadableStream(stream, title), {
			title,
			thumbnail: Input.fromURLStream(thumbnails[0].url),
			caption: fmt`${filesize(fileSizeBytes)}`,
			duration: durationSeconds,
		});
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

process.on("unhandledRejection", (reason, p) => {
	console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
	// application specific logging, throwing an error, or other logic here
});

app.get("/", (req, res) => res.json({ message: "I'm better than god, I exist." }));

function launch() {
	console.log(`[MoeYTT] Starting...`);
	app.listen(process.env.PORT, () => console.log(`[MoeYTT] Webserver is running on port ${process.env.PORT}`));
	job.start();
	console.log(`[MoeYTT] CronJob started!`);
	client.launch();
}
