import { Command } from '../deps.ts'

export type Update = {
	global?: boolean
	dev?: boolean
}

export function updateHandler({ global, dev }: Update, packageName: string) {
	throw new Error('Not implemented')
}

export const updateCommand = new Command()
	.description('Update depedency')
	.option('-g, --global', 'Update global dependency', { default: false })
	.option('-d, --dev', 'Update dev dependency', { default: false })
	.arguments('<name:string>')
	.action(updateHandler)
