/**
 * Fisher-Yates shuffle algorithm
 * Creates a new shuffled array without mutating the original
 */
export function shuffle<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = result[i];
		const swapValue = result[j];
		if (temp !== undefined && swapValue !== undefined) {
			result[i] = swapValue;
			result[j] = temp;
		}
	}
	return result;
}
