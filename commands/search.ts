import { Command } from '../deps.ts'

export type Search = {
	provider?: string
}

export function searchHandler({ provider }: Search, query: string) {
	throw new Error('Not implemented')
}

export const searchCommand = new Command()
	.description('Search a package')
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: https://deno.land/x/',
	)
	.arguments('<name:string>')
	.action(searchHandler)
