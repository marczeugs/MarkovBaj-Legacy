import * as fs from 'fs';
import fetch from 'node-fetch';

type ResponseFormat = {
	data: {
		author: string,
		body: string,
		created_utc: number
	}[]
}

(async () => {
	const blacklistedUsernames = fs.readFileSync('usernameBlacklist.txt', 'utf8').trim().split('\n');

	const urlTemplate = 'https://api.pushshift.io/reddit/search/comment/?subreddit=forsen&size=500&before=';

	let lastTimestamp = Math.floor((new Date(2021, 9, 11)).getTime() / 1000); // Before emotes and gifs were introduced
	let allComments: string[] = [];

	while (true) {
		try {
			const nextComments = (await fetch(urlTemplate + lastTimestamp).then((response: any) => response.json()) as ResponseFormat).data;
			const filteredComments = nextComments.filter(comment => !blacklistedUsernames.includes(comment.author)
				&& !['markovbaj', '[deleted]'].includes(comment.author.toLowerCase())
				&& !['mr fors', 'markov'].some(string => comment.body.toLowerCase().includes(string))
			);
			
			allComments = [
				...allComments, 
				...filteredComments.map(comment => comment.body.replace(/\[(.*)\]\(.*\)/g, (_, text) => text).replace(/["()*]/g, '').trim())
			];
			
			console.log(`Fetched ${filteredComments.length} comments before ${new Date(lastTimestamp * 1000)}, total comments: ${allComments.length}`);
			fs.writeFileSync('data.json', JSON.stringify(allComments));

			lastTimestamp = nextComments.pop()!.created_utc;
		} catch (_) {
			console.log(`Unable to fetch comments before ${new Date(lastTimestamp * 1000)}, retrying...`);
		}

		await new Promise(resolve => global.setTimeout(resolve, 2000));
	}
})();