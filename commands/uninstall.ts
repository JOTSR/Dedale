import { Command } from "../deps.ts";

export type Uninstall = {
	global: boolean
	dev?: boolean
}

export function uninstallHandler({ global, dev }: Uninstall, packageName: string) {
	throw new Error('Not implemented')
}

export const uninstallCommand = new Command()
	.description('Uninstall depedency')
	.option('-g, --global', 'Uninstall global dependency', { default: false })
	.option('-d, --dev', 'Uninstall dev dependency', { default: false })
	.arguments('<name:string>')
	.action(uninstallHandler)