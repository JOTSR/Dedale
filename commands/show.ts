import {
	Cell,
	colors,
	Command,
	ModInfoPage,
	Module,
	renderMarkdown,
	Table,
} from '../deps.ts'
import { dedale, PackageImportEntry } from '../definitions.ts'
export async function resolvePackages(
	log: boolean,
	provider: string,
	packageName: string,
	doc?: boolean,
): Promise<PackageImportEntry> {
	if (provider === 'deno.land/x') {
		const moduleName = packageName.includes('@')
			? packageName
			: await (async () => {
				const response = await fetch(
					`https://apiland.deno.dev/v2/modules/${packageName}`,
				)
				const module = await response.json() as Module
				const { latest_version, name } = module
				return `${name}@${latest_version}`
			})()

		const response = await fetch(
			`https://apiland.deno.dev/v2/pages/mod/info/${
				moduleName.replace('@', '/')
			}`,
		)
		const {
			module,
			version,
			versions,
			defaultModule,
			description,
			upload_options,
			readme,
		} = await response.json() as ModInfoPage
		const url = `https://deno.land/x/${moduleName}`

		const links = [
			`🔗 Import: ${url}${defaultModule?.path}`,
			`📖 Readme: ${url}${readme?.path}`,
			`🌐 Page:   ${url}`,
		]

		if (log) {
			await moduleLogger({
				module,
				version,
				infos: upload_options.repository,
				links,
				description: description ?? 'No description',
				versions: versions.slice(0, 20),
				readmeUrl: `${url}${readme?.path}`,
				doc,
			})
		}
		return {
			name: module,
			path: `${url}${defaultModule?.path}`,
			latest: `https://deno.land/x/${module}@${
				versions[0]
			}${defaultModule?.path}`,
		}
	}
	if (provider === 'nest.land') {
		const [name, _] = packageName.split('@')
		const packageInfos =
			(await (await fetch('https://nest.land/api/package-client', {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
				'body': JSON.stringify({ data: { name } }),
				'method': 'POST',
			})).json()).body

		const links = [
			`🔗 Import: https://nest.land/package/${name}/mod.ts`,
			`🌐 Page:   https://nest.land/package/${name}`,
		]

		if (log) {
			await moduleLogger({
				module: packageInfos.name,
				version: packageInfos.latestVersion.split('@')[1],
				infos: packageInfos.owner,
				links,
				description: packageInfos.description ?? 'No description',
				versions: packageInfos.packageUploadNames.map((
					version: string,
				) => version.split('@')[1]),
				readmeUrl: `data:text/plain,${
					encodeURIComponent('README not supported for nest.land')
				}`,
				doc,
			})
		}

		return {
			name: packageInfos.name,
			path: `https://nest.land/package/${name}/mod.ts`,
			latest:
				`https://nest.land/package/${packageInfos.latestVersion}/mod.ts`,
		}
	}
	if (provider === 'github.com') {
		const [name, _] = packageName.split('@')
		const repo = await (await fetch(
			`https://api.github.com/repos/${name}`,
		)).json()
		const { full_name: module, description, html_url, stargazers_counts } =
			repo
		const versions =
			await (await fetch(`https://api.github.com/repos/${name}/tags`))
				.json()
		const links = [
			`🔗 Import: https://raw.githubusercontent.com/${name}/${
				versions[0].name
			}/`,
			`📖 Readme: https://raw.githubusercontent.com/${name}/${
				versions[0].name
			}/README.md`,
			`🌐 Page:   ${html_url}`,
		]

		if (log) {
			await moduleLogger({
				module,
				version: versions[0].name,
				infos: `✨ ${stargazers_counts}`,
				links,
				description,
				versions: versions.map(({ name }: { name: string }) => name),
				readmeUrl: `https://raw.githubusercontent.com/${name}/${
					versions[0].name
				}/README.md`,
				doc,
			})
		}
		return {
			name: module,
			path: `https://raw.githubusercontent.com/${name}/${
				versions[0].name
			}`,
			latest: `https://raw.githubusercontent.com/${name}/${
				versions[0].name
			}`,
		}
	}
	if (provider === 'npm') {
		const results = await (await fetch(
			`https://registry.npmjs.org/${packageName}`,
		)).json()
		const { _id: module, time, author, description, readme } = results

		const [_, ...versionEntries] = Object.entries(time).toSorted((
			[_, dateA],
			[__, dateB],
		) => new Date(String(dateB)).getTime() -
			new Date(String(dateA)).getTime()
		)
		const latest = packageName.split('@')[1] ?? versionEntries[0][0]
		const links = [
			`🔗 Import: npm:${packageName}@${latest}`,
			`🌐 Page:   https://www.npmjs.com/package/${packageName}/v/${latest}`,
		]

		if (log) {
			await moduleLogger({
				module,
				version: latest,
				infos: author.name,
				links,
				description,
				versions: versionEntries.slice(0, 20).map((
					[version, _]: [string, unknown],
				) => version),
				readmeUrl: `data:text/plain,${encodeURIComponent(readme)}`,
				doc,
			})
		}
		return {
			name: module,
			path: `npm:${packageName}@${latest}`,
			latest: `npm:${packageName}@${latest}`,
		}
	}
	throw new Error(`show unsupported for provider ${provider}`)
}

export type Show = {
	provider?: string
	doc?: boolean
}

export async function showHandler({ provider, doc }: Show, query: string) {
	try {
		await resolvePackages(
			true,
			provider ?? dedale.config?.defaultProvider ?? 'deno.land/x',
			query,
			doc,
		)
	} catch (e) {
		console.error(`❌ Package not found [${e}]`)
	}
}

export const showCommand = new Command()
	.name('Show package infos')
	.description('Show detailed package infos from repository')
	.version('0.1.0')
	.option(
		'-p, --provider <url:string>',
		'Provider to use (ex: deno.land/x)',
	)
	.option('-d, --doc', 'Display readme')
	.arguments('<name:string>')
	.action(showHandler)

async function moduleLogger(
	{
		module,
		version,
		infos,
		links,
		description,
		versions,
		readmeUrl,
		doc,
	}: {
		module: string
		version: string
		infos: string
		links: string[]
		description: string
		versions: string[]
		readmeUrl: string | undefined
		doc: boolean | undefined
	},
) {
	const title = `${colors.bold.green(module)}@${colors.bold.blue(version)} ${
		colors.gray('(' + infos + ')')
	}`

	Table.from([
		[new Cell(title).align('center').colSpan(2)],
		[
			new Cell('Links'),
			links.join('\n'),
		],
		[
			'Description',
			`${description}`,
		],
		[
			'Versions',
			versions.map((version) => `- ${version}`).join('\n'),
		],
	])
		.border(true)
		.maxColWidth(Deno.consoleSize().columns / 1.3)
		.render()

	if (readmeUrl && doc) {
		console.log(
			'%c' +
				'README'.padEnd(Deno.consoleSize().columns / 2).padStart(
					Deno.consoleSize().columns,
				),
			'color: white; background-color: dodgerblue; font-weight: bold',
		)
		const readme = await (await fetch(readmeUrl)).text()
		console.log(renderMarkdown(readme))
	}
}
