import { Command } from '../deps.ts'

export type Install = {
	global?: boolean
	dev?: boolean
	provider?: string
}

export function installHandler(
	{ global, dev, provider }: Install,
	packageName: string,
) {
	throw new Error('Not implemented')
}

export const installCommand = new Command()
	.description('Install depedency')
	.option('-g, --global', 'Install dependency globally', { default: false })
	.option('-d, --dev', 'Install dependency in project deps.dev.ts', {
		default: false,
	})
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: https://deno.land/x/',
	)
	.arguments('<name:string>')
	.action(installHandler)
