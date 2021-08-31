import * as fs from 'fs';
import Snoowrap from 'snoowrap';

(async () => {
	const bot = new Snoowrap({
		userAgent: 'NodeJS/Snoowrap',
		clientId: process.env['clientId'],
		clientSecret: process.env['clientSecret'],
		username: process.env['username'],
		password: process.env['password'],
	});

	const comments = await (await bot.getSubreddit('forsen').getNewComments({ count: 1000 })).fetchAll();
	const mapper = (comment: Snoowrap.Comment) => comment.body.replace(/\[(.*)\]\(.*\)/g, (_, text) => text).trim();
	const mappedComments = [...comments.map(mapper)];
	//let lastCommentFullName = comments[comments.length - 1]!.name;

	/*for (let i = 0; i < 10; i++) {
		const nextComments = await bot.getSubreddit('forsen').getNewComments({ limit: 100, before: lastCommentFullName });
		mappedComments.push(...nextComments.map(mapper));

		lastCommentFullName = nextComments[nextComments.length - 1]!.name;
	}*/
	console.log(comments.length);

	fs.writeFileSync('data.txt', JSON.stringify(mappedComments));
})();