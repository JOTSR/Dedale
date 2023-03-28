import { Config, dedale, Tree } from './definitions.ts'
import { tree } from './definitions.ts'
import { fs, path } from './deps.ts'
import { LoadInfo, readConfigFile } from './utils.ts'

const loadInfo = new LoadInfo()

async function makeTree(tree: Tree, root: string) {
	for (const key in tree) {
		if ('file' in tree[key]) {
			//@ts-ignore "file" in tree[key]
			await fs.ensureFile(path.join(root, tree[key].file))
		}
		if ('dir' in tree[key]) {
			//@ts-ignore "dir" in tree[key]
			await fs.ensureDir(path.join(root, tree[key].dir))
		}
		if ('tree' in tree[key]) {
			//@ts-ignore "dir" and "tree" in tree[key]
			await makeTree(tree[key].tree, path.join(root, tree[key].dir))
		}
	}
}

async function installPlugins(plugins: Config['plugins']) {
	for (const plugin in plugins) {
		//Cache plugin in .deno/
		await import(plugins[plugin].path)
	}
}

async function installFromGitub(
	owner: string,
	repo: string,
	baseUrl: string,
	outputDirectory: string,
	logger: LoadInfo,
	url = '',
) {
	if (!url.startsWith('https://api.github.com')) {
		url =
			`https://api.github.com/repos/${owner}/${repo}/contents/${baseUrl}`
	}
	try {
		const entries = await (await fetch(url)).json() as Record<
			string,
			string
		>[]
		for (
			const { path: relative_path, download_url, url, type, html_url }
				of entries
		) {
			if (type === 'file') {
				logger.push(`Installing: ${html_url}`, undefined, true)
				const outPath = path.join(
					outputDirectory,
					relative_path.replace(baseUrl, ''),
				)
				await fs.ensureFile(outPath)
				const file = await fetch(download_url)
				const fsFile = await Deno.open(outPath, {
					create: true,
					write: true,
					truncate: true,
				})
				await file.body?.pipeTo(fsFile.writable)
			} else {
				await installFromGitub(
					owner,
					repo,
					baseUrl,
					outputDirectory,
					logger,
					url,
				)
			}
		}
	} catch (e) {
		throw new Error('Unable to install default dedale files', { cause: e })
	}
}

async function installShellCompletions(os: typeof Deno.build.os) {
	switch (os) {
		case 'windows':
			{
				const completions = await fetch(
					'https://github.com/JOTSR/Dedale/install/DedaleCompletions.ps1',
				)
				const modulePath = Deno.env.get('PSModulePath')?.split(';')[0]
				if (modulePath === undefined) {
					throw new Error(
						'$env:PSModulePath is not set, can\'t install completions for powershell',
					)
				}

				const script = await Deno.open(
					path.join(modulePath, 'DedaleCompletions.ps1'),
					{
						create: true,
						write: true,
						truncate: true,
					},
				)
				await completions.body?.pipeTo(script.writable)
				script.close()
				console.log(`DedaleCompletions.ps1 added to $.split(';')[0]`)
				console.log(
					`Add '. ($PSScriptRoot + "\\Modules\\DedaleCompletions.ps1")' to your $PROFILE`,
				)
			}
			break
		case 'linux':
		case 'darwin':
			//TODO Cliffy shell completions
			throw new Error('Not implemented')
			// break
	}
}

async function installCli(url: string) {
	const command = new Deno.Command(Deno.execPath(), {
		args: [
			'install',
			'-A',
			'--unstable',
			'--quiet',
			'-n dedale',
			'-f',
			url,
		],
	})
	await command.output()
}

//Installation steps

loadInfo.push(`Generating ${dedale.session.directory.root} directory`, {
	current: 1,
	total: 6,
})
await makeTree(tree, dedale.session.home)

loadInfo.push(
	`Installing default config files from https://github.com/JOTSR/Dedale/install/.dedale`,
	{ current: 2, total: 6 },
)
await installFromGitub(
	'JOTSR',
	'Dedale',
	'install/.dedale/',
	dedale.session.directory.root,
	loadInfo,
)

loadInfo.push(
	`Installing default templates from https://github.com/JOTSR/dedale-templates`,
	{ current: 3, total: 6 },
)
await installFromGitub(
	'JOTSR',
	'dedale-templates',
	'',
	dedale.session.directory.templates,
	loadInfo,
)

const config = await readConfigFile(dedale.session.directory.config)

loadInfo.push(`Caching plugins`, { current: 4, total: 6 })
await installPlugins(config.plugins)

loadInfo.push(
	`Installing shell completion for ${
		Deno.build.os === 'windows' ? 'powershell' : 'bash'
	}`,
	{ current: 5, total: 6 },
)
await installShellCompletions(Deno.build.os)

loadInfo.push(`Installing cli`, { current: 6, total: 6 })
await installCli('https://github.com/JOTSR/Dedale/main.ts')

console.log(
	'Dédale is successfully installed, try "dedale -h" or visit https://doc.dedale.io',
)
