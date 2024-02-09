import youtubedl, { Payload } from "youtube-dl-exec";
import ytdl from "ytdl-core";

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
	const videoData = await ytdl.getBasicInfo(`https://youtu.be/${id}`);
	const video = ytdl(`https://youtu.be/${id}`, { quality: "lowestaudio" });

	return {
		...videoData.videoDetails,
		stream: video,
	};
}

export function generateVideoURL(id: string) {
	return "https://youtu.be/" + id;
}
