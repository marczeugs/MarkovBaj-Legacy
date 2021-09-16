export class MarkovChain {
	public chainStarts = new WeightedSet<string>();
	public followingWords = new Map<string, WeightedSet<string | null>>();

	constructor(private excludeTerms: string[] = []) { }

	public addData(data: string[][]) {
		inPlaceMap(
			data, 
			sequence => sequence.filter(word => 
				!this.excludeTerms.some(term => word.toLowerCase().includes(term.toLowerCase()))
			)
		);

		for (let i = 0; i < data.length; i++) {
			this.chainStarts.addValue(data[i]![0]!);
		}

		for (let i = 0; i < data.length; i++) {
			const sequence = data[i]!;

			for (let i = 0; i < sequence.length; i++) {
				const firstWord = sequence[i]!;
				const followingWord = sequence[i + 1] ?? null;
				
				if (!this.followingWords.has(firstWord)) {
					this.followingWords.set(firstWord, new WeightedSet());
				}

				this.followingWords.get(firstWord)!.addValue(followingWord);
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

	public addValue(value: T) {
		if (this.weightMap.has(value)) {
			this.weightMap.set(value, this.weightMap.get(value)! + 1);
		} else {
			this.weightMap.set(value, 1);
		}

		this.weightSum++;
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

function inPlaceMap<T>(array: T[], operation: (element: T) => T) {
	for (let i = 0; i < array.length; i++) {
		array[i] = operation(array[i]!);
	}
}