import * as fs from 'fs';
import { MarkovChain } from './MarkovChain';
import Snoowrap from 'snoowrap';

const checkInterval = 2 * 60;
const postReplyProbability = 1;
const commentReplyProbability = 0.5;
const maxCommentsPerInterval = 5;
const delayBetweenComments = 15_000;

(async () => {
	const comments: string[] = JSON.parse(fs.readFileSync('data.txt', 'utf8'));
	
	const markovChain = new MarkovChain();
	markovChain.addData(comments.map(comment => comment.split(/\s+/)));
	
	const bot = new Snoowrap({
		userAgent: 'NodeJS/Snoowrap',
		clientId: process.env['clientId'],
		clientSecret: process.env['clientSecret'],
		username: process.env['username'],
		password: process.env['password'],
	});

	const forsenSubreddit: Snoowrap.Subreddit = await (bot.getSubreddit('forsen') as any);

	global.setInterval(async () => {
		const newPosts = (await forsenSubreddit.getNew({ limit: 10 })).filter(post => (Date.now() / 1000) - post.created_utc < checkInterval);
		const newComments = (await bot.getNewComments('forsen', { limit: 100 })).filter(comment => (Date.now() / 1000) - comment.created_utc < checkInterval);
		console.log(`${newPosts.length} new post(s), ${newComments.length} new comment(s).`);

		let commentCounter = 0;

		for (const post of newPosts) {
			if (post.removal_reason !== null) {
				continue;
			}

			if (Math.random() < postReplyProbability) {
				const shuffledTitle = shuffleArray(post.title.split(/\s+/));

				tryToReply: {
					while (shuffledTitle.length > 0) {
						const firstWord = shuffledTitle.pop()!;

						if (markovChain.chainStarts.weightMap.has(firstWord)) {
							const reply = markovChain.generate(firstWord).join(' ');
							//post.reply(reply);
							//console.log(`[DRY RUN] Would reply to post "${post.title}" with "${reply}".`);
							console.log(`Replied to post "${post.title}" with "${reply}".`);
							commentCounter++;

							await new Promise(resolve => global.setTimeout(resolve, delayBetweenComments));

							break tryToReply;
						}
					}

					console.error(`Unable to generate a response for post "${post.title}", sending default...`);

					const reply = markovChain.generate().join(' ');
					//post.reply(reply);
					//console.log(`[DRY RUN] Would default reply to post "${post.title}" with "${reply}".`);
					console.log(`Default replied to post "${post.title}" with "${reply}".`);
					commentCounter++;

					await new Promise(resolve => global.setTimeout(resolve, delayBetweenComments));
				}
			}

			if (commentCounter >= maxCommentsPerInterval) {
				break;
			}
		}

		for (const comment of newComments) {
			if (comment.author.name.toLowerCase() === bot.username.toLowerCase()) {
				continue;
			}

			if (Math.random() < commentReplyProbability || comment.body.toLowerCase().includes('markov')) {
				const shuffledBody = shuffleArray(comment.body.split(/\s+/));

				tryToReply: {
					while (shuffledBody.length > 0) {
						const firstWord = shuffledBody.pop()!;

						if (markovChain.chainStarts.weightMap.has(firstWord)) {
							const reply = markovChain.generate(firstWord).join(' ');
							//comment.reply(reply);
							//console.log(`[DRY RUN] Would reply to comment "${comment.body}" with "${reply}".`);
							console.log(`Replied to comment "${comment.body}" with "${reply}".`);
							commentCounter++;

							await new Promise(resolve => global.setTimeout(resolve, delayBetweenComments));

							break tryToReply;
						}
					}

					console.error(`Unable to generate a response for comment "${comment.body}", sending default...`);

					const reply = markovChain.generate().join(' ');
					//comment.reply(reply);
					//console.log(`[DRY RUN] Would default reply to comment "${comment.body}" with "${reply}".`);
					console.log(`Default replied to comment "${comment.body}" with "${reply}".`);
					commentCounter++;

					await new Promise(resolve => global.setTimeout(resolve, delayBetweenComments));
				}
			}

			if (commentCounter >= maxCommentsPerInterval) {
				break;
			}
		}
	}, checkInterval * 1000);

	console.log('Bot running.');
})();

function shuffleArray<T>(array: T[]): T[] {
	const shuffledArray: T[] = [];

	while (array.length > 0) {
		shuffledArray.push(array.splice(Math.floor(Math.random() * (array.length - 1)), 1)[0]!);
	}

	return shuffledArray;
}