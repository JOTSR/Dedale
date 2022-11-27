import { Command } from "../deps.ts";

export type Version = {
	list?: boolean
	install?: string
	uninstall?: string
}

export function versionHandler({ list, uninstall, install }: Version, versionName: string) {
	throw new Error('Not implemented')
}

export const versionCommand = new Command()
	.description('Manage versions of deno executable')
	.option('-l, --list', 'List installed versions', { default: false })
	.option('-i, --install [string]', 'Version to install')
	.option('-u, --uninstall [string]', 'Version to uninstall')
	.arguments('[string]')
	//@ts-ignore bad inference
	.action(versionHandler)