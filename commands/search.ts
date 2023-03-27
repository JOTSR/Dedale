import { dedale } from '../definitions.ts'
import { Command, Module } from '../deps.ts'

async function resolvePackages(provider: string, packageName: string) {
	if (provider === 'deno.land/x') {
		const results =
			await (await fetch(`https://deno.land/x?query=${packageName}`))
				.text()
		const packages = [...results.matchAll(/<a href=\"\/x\/(\w+)/g)].map((
			[_, name],
		) => name).slice(0, 10)
		for (const moduleName of packages) {
			const { latest_version, name, description, popularity_score } =
				await (await fetch(
					`https://apiland.deno.dev/v2/modules/${moduleName}`,
				)).json() as Module
			console.log(
				`%c${name}%c@${latest_version}%c - ${
					description.slice(0, 50)
				}... %c(✨ ${popularity_score})`,
				'color: green; font-weight: bold',
				'color: blue; font-weight: bold',
				'color: white',
				'color: gray',
			)
		}
		return
	}
	if (provider === 'nest.land') {
		const results = await (await fetch(`https://x.nest.land/api/packages`))
			.json() as Record<string, string>[]
		const packages = results.filter(({ name }) =>
			name.includes(packageName)
		).slice(0, 10)
		for (const { latestVersion, description, owner } of packages) {
			console.log(
				`%c${latestVersion}%c - ${
					description.slice(0, 50)
				}... %c(@${owner})`,
				'color: green; font-weight: bold',
				'color: white',
				'color: gray',
			)
		}
		return
	}
	if (provider === 'github.com') {
		const results = await (await fetch(
			`https://api.github.com/search/repositories?q=${packageName}`,
		)).json()
		const packages = results.items.slice(0, 10)
		for (const { name, description, score, owner } of packages) {
			console.log(
				`%c${name}%c - ${description?.slice(0, 50)}... %c(✨ ${
					score.toFixed(2)
				} @${owner.login})`,
				'color: green; font-weight: bold',
				'color: white',
				'color: gray',
			)
		}
		return
	}
	if (provider === 'npm') {
		const results = await (await fetch(
			`https://registry.npmjs.org/-/v1/search?text=${packageName}`,
		)).json()
		for (
			const { package: pkg } of results.objects.slice(0, 10)
		) {
			const { name, version, description, publisher } = pkg
			console.log(
				`%c${name}@%c${version}%c - ${
					description?.slice(0, 50)
				}... %c(@${publisher?.username})`,
				'color: green; font-weight: bold',
				'color: blue; font-weight: bold',
				'color: white',
				'color: gray',
			)
		}
		return
	}
	throw new Error(`search unsupported for provider ${provider}`)
}

export type Search = {
	provider?: string
}

export async function searchHandler(
	{ provider }: Search,
	query: string,
) {
	await resolvePackages(
		provider ?? dedale.config?.defaultProvider ?? 'deno.land/x',
		query,
	)
}

export const searchCommand = new Command()
	.description('Search a package')
	.option(
		'-p, --provider <name:string>',
		'Provider to use (ex: deno.land/x)',
	)
	.arguments('<name:string>')
	.action(searchHandler)
