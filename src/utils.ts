import youtubedl, { Payload } from "youtube-dl-exec";
import ytdl from "ytdl-core";
import { channelIDs } from "./config";

export async function getLatestVideos() {
	return Promise.all(
		channelIDs.map(async (channelId) => {
			const video = await getLatestVideo(channelId);
			return video;
		}),
	);
}

export async function getLatestVideo(channelId: string) {
	const channel = (await youtubedl(`https://www.youtube.com/channel/${channelId}/videos`, {
		skipDownload: true,
		dumpSingleJson: true,
		playlistEnd: 1,
	})) as Payload & {
		entries: Payload[];
	};

	const video = channel.entries[0];

	return video;
}

export async function getVideo(id: string) {
	const videoData = await ytdl.getInfo(`https://youtu.be/${id}`);
	const format = ytdl.chooseFormat(videoData.formats, { quality: "lowestaudio" });
	const video = ytdl.downloadFromInfo(videoData, { quality: "lowestaudio", filter: (format) => !format.hasVideo && format.hasAudio });

	return {
		...videoData.videoDetails,
		format,
		stream: video,
	};
}

export function generateVideoURL(id: string) {
	return "https://youtu.be/" + id;
}
