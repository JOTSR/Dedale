import { dedale } from '../definitions.ts'
import { Command } from '../deps.ts'
import { ImportMap } from '../utils.ts'
import { resolvePackages } from './show.ts'

export type Update = {
	dev?: boolean
	provider?: string
}

export async function updateHandler(
	{ dev, provider }: Update,
	...packageNames: string[]
) {
	if (packageNames[0] === '*') {
		packageNames = (await ImportMap.get()).map(({ name }) => name)
	}
	for (const packageName of packageNames) {
		try {
			const { name, latest } = await resolvePackages(
				false,
				provider ?? dedale.config?.defaultProvider ?? 'deno.land/x',
				packageName,
				false,
			)
			if (name === undefined || name === 'undefined') {
				throw new Error(`invalid package name (${name})`)
			}

			await ImportMap.set({
				path: latest,
				name,
				kind: dev ? 'dev' : 'asset',
			})
			console.log(`✔️ Package ${packageName} successfully installed`)
		} catch (error) {
			console.error(`❌ Package ${packageName} not found [${error}]`)
		}
	}
}

export const updateCommand = new Command()
	.description('Update depedency')
	.description(
		'Update dependencies for current project in import map, use "*" for update all',
	)
	.version('0.1.0')
	.option('-d, --dev', 'Update dev dependency', { default: false })
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: https://deno.land/x/)',
	)
	.arguments('<name...:string>')
	.action(updateHandler)
