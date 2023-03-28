import { dedale } from '../definitions.ts'
import { Command } from '../deps.ts'
import { ImportMap } from '../utils.ts'
import { resolvePackages } from './show.ts'

export type Install = {
	dev?: boolean
	provider?: string
}

export async function installHandler(
	{ dev, provider }: Install,
	...packageNames: string[]
) {
	for (const packageName of packageNames) {
		try {
			const { name, path, latest } = await resolvePackages(
				false,
				provider ?? dedale.config?.defaultProvider ?? 'deno.land/x',
				packageName,
				false,
			)
			if (name === undefined || name === 'undefined') {
				throw new Error(`invalid package name (${name})`)
			}

			if (path !== latest) {
				console.warn(
					`⚠️ A newer version of %c${name}%c is aviable %c${latest}`,
					'font-weight: bold; color: black; background-color: white',
					'',
					'color: green',
				)
			}
			await ImportMap.set({ path, name, kind: dev ? 'dev' : 'asset' })
			console.log(`✔️ Package ${packageName} successfully installed`)
		} catch (error) {
			console.error(`❌ Package ${packageName} not found [${error}]`)
		}
	}
}

export const installCommand = new Command()
	.name('Install depedency')
	.description('Install dependencies for current project in import map')
	.version('0.1.0')
	.option('-d, --dev', 'Install dependency as dev:name', {
		default: false,
	})
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: https://deno.land/x/)',
	)
	.arguments('<name...:file>')
	.action(installHandler)
