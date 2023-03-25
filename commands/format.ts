import { Command } from '../deps.ts'

export function formatHandler() {
	throw new Error('Not implemented')
}

export const formatCommand = new Command()
	.description('Format code withe the specified formatter')
	.action(formatHandler)
