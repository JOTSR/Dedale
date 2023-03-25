import { Command } from '../deps.ts'

export type Show = {
	provider?: string
}

export function showHandler({ provider }: Show, packageName: string) {
	throw new Error('Not implemented')
}

export const showCommand = new Command()
	.description('Show package info')
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: https://deno.land/x/',
	)
	.arguments('<name:string>')
	.action(showHandler)
