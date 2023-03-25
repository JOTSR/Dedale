import { Command } from '../deps.ts'

// export type Plugin = {
// 	install?: string
// 	activate?: string
// 	deactivate?: string
// 	list?: string
// 	uninstall?: string
// }

// export function pluginHandler({
// 	install,
// 	activate,
// 	deactivate,
// 	list,
// 	uninstall,
// }: Plugin) {
// 	throw new Error('Not implemented')
// }

export function xPluginHandler() {
	throw new Error('Not implemented')
}

// export const pluginCommand = new Command()
// 	.description('Compile script to an executable')
// 	.option('-i, --install [string]', 'Install plugin')
// 	.option('-a, --entry-point [string]', 'Entry point of the executable', { default: 'main.ts' })
// 	.option('-d, --icon [file]', 'Icon to use')
// 	.option('-l, --out-name [string]', 'Executable name')
// 	.option('-u, --uninstall', 'Use V8 snapshot', { default: false })
// 	//@ts-ignore bad inference
// 	.action(pluginHandler)

export const xPluginCommand = new Command()
	.description('Execute plugin addon command')
	.option('-x-*, --plugin-*', 'Plugin extension')
	.action(xPluginHandler)
