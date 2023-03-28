import { Command } from '../deps.ts'
import { ImportMap } from '../utils.ts'

export type Uninstall = {
	provider?: string
	dev?: boolean
}

export async function uninstallHandler(
	{ dev }: Uninstall,
	...packageNames: string[]
) {
	for (const packageName of packageNames) {
		try {
			await ImportMap.delete({
				name: packageName,
				kind: dev ? 'dev' : 'asset',
			})
			console.log(`✔️ Package ${packageName} successfully removed`)
		} catch (error) {
			console.error(`❌ Package ${packageName} not found [${error}]`)
		}
	}
}

export const uninstallCommand = new Command()
	.name('Uninstall depedency')
	.version('0.1.0')
	.description('Uinstall dependencies from import map')
	.option('-d, --dev', 'Uninstall dev dependency', { default: false })
	.arguments('<name...:string>')
	.action(uninstallHandler)
