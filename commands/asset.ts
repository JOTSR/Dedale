import { Command, path } from '../deps.ts'
import { ImportMap } from '../utils.ts'

type Asset = {
	install?: boolean
	uninstall?: boolean
	list?: boolean
	link?: boolean
	name?: string
}
export async function assetHandler(
	{ install, uninstall, list, link, name }: Asset,
	asset: string,
) {
	if (list) {
		const entries = await ImportMap.get()
		const assets = entries.filter(({ kind }) => kind === 'asset')
		for (const { name, path } of assets) {
			console.log(
				`%c- %c${name} %c: %c${path}`,
				'color: white',
				'color: green; font-weight: bold',
				'color: gray;',
				'text-decoration: underline',
			)
		}
		return
	}
	if (install) {
		await ImportMap.set({
			name: name ?? getName(asset),
			kind: 'asset',
			path: asset,
		})
		return
	}
	if (uninstall) {
		await ImportMap.delete({ name: name ?? getName(asset), kind: 'asset' })
		return
	}
	if (link) {
		throw new Error('Not implemented')
	}
	throw new TypeError('unknown option')
}

function getName(pathName: string) {
	const url = pathName.startsWith('http')
		? new URL(pathName)
		: path.toFileUrl(pathName)
	const parsed = path.parse(url.pathname)
	return parsed.name
}

export const assetCommand = new Command()
	.name('Import asset')
	.version('0.1.0')
	.description(
		'Add static asset to project via https://ejm.sh or json encapsulation',
	)
	.option('-i, --install', 'Install asset')
	.option('-u, --uninstall', 'Uninstall asset', {
		conflicts: ['install', 'list'],
	})
	.option('-l, --list', 'List asset', { conflicts: ['install', 'uninstall'] })
	.option('-k, --link', 'Install local asset', {
		conflicts: ['install', 'uninstall', 'list'],
	})
	.option('-n, --name <name:string>', 'Asset name, default is path file name')
	.arguments('<asset:file>')
	.action(assetHandler)
