export class MarkovChain {
	public chainStarts = new WeightedSet<string>();
	public followingWords = new Map<string, WeightedSet<string | null>>();

	constructor(private excludeTerms: string[] = []) { }

	public addData(data: string[][]) {
		const filteredData = data.map(sequence => 
			sequence.filter(word => 
				!this.excludeTerms.some(term => word.toLowerCase().includes(term.toLowerCase()))
			)
		)

		this.chainStarts.addData(filteredData.map(sequence => sequence[0]!));

		for (const sequence of filteredData) {
			const sequenceParts = [...sequence, null];

			let firstWord: string, followingWord: string;

			for (let i = 0; i < sequenceParts.length - 1; i++) {
				[firstWord, followingWord] = sequenceParts.slice(i, i + 2) as [string, string];
				
				if (!this.followingWords.has(firstWord)) {
					this.followingWords.set(firstWord, new WeightedSet());
				}

				this.followingWords.get(firstWord)!.addData([followingWord]);
			}
		}
	}

	public generate(start: string = this.chainStarts.getRandomValue(), maxLength: number = 100) {
		const sequence = [start];
		let currentLength = 0;
		let nextWord;

		while ((nextWord = this.followingWords.get(sequence[sequence.length - 1]!)) != null) {
			sequence.push(nextWord.getRandomValue()!);

			currentLength++;

			if (currentLength > maxLength) {
				break;
			}
		}

		return sequence;
	}
}

class WeightedSet<T> {
	public weightMap = new Map<T, number>();
	private weightSum: number = 0;

	public addData(data: T[]) {
		for (const value of data) {
			if (this.weightMap.has(value)) {
				this.weightMap.set(value, this.weightMap.get(value)! + 1);
			} else {
				this.weightMap.set(value, 1);
			}
		}
	}

	public getRandomValue(): T {
		let weightValue = Math.floor(Math.random() * this.weightSum);
		let currentItem: T, weight: number;

		for ([currentItem, weight] of this.weightMap.entries()) {
			weightValue -= weight;

			if (weightValue < 0) {
				return currentItem;
			}
		}

		throw '';
	}
}