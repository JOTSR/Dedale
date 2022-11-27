export type Search = {
	provider?: string
	query: string
}

export function search({ provider, query }: Search) {
	throw new Error('Not implemented')
}
