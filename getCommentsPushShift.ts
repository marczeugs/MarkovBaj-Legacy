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

	let lastTimestamp = Math.floor(Date.now() / 1000);
	let allComments: string[] = [];

	while (true) {
		try {
			const nextComments = (await fetch(urlTemplate + lastTimestamp).then((response: any) => response.json()) as ResponseFormat).data
				.filter(comment => !['markovbaj', '[deleted]'].includes(comment.author.toLowerCase()));
			
			allComments = [
				...allComments, 
				...nextComments
					.filter(comment => !blacklistedUsernames.includes(comment.author))
					.map(comment => comment.body.replace(/\[(.*)\]\(.*\)/g, (_, text) => text).replace(/["()*]/g, '').trim())
			];
			
			console.log(`Fetched ${nextComments.length} comments before ${new Date(lastTimestamp * 1000)}, total comments: ${allComments.length}`);
			fs.writeFileSync('data.txt', JSON.stringify(allComments));

			lastTimestamp = nextComments.pop()!.created_utc;
		} catch (_) {
			console.log(`Unable to fetch comments before ${new Date(lastTimestamp * 1000)}, retrying...`);
		}

		await new Promise(resolve => global.setTimeout(resolve, 2000));
	}
})();