import { Command, EnumType, releases } from '../deps.ts'

const denoVersions = [
	...releases.text.matchAll(
		/###\s(\d+)\.(\d+)\.(\d+)\s\/\s(.*)/g,
	) as string[][],
].map((line) => {
	const [major, minor, patch] = line.slice(1).map((number) =>
		parseInt(number)
	)
	const [date] = line.slice(-1)
	return { major, minor, patch, date } as const
})

const latestVersion = denoVersions[0]

export type Version = {
	list?: boolean
	force?: boolean
	quiet?: boolean
	version: string | true
}

export function versionHandler(
	{ list, force, quiet, version }: Version,
) {
	if (list) {
		denoVersions.map(({ major, minor, patch, date }) => {
			console.log(`v${major}.${minor}.${patch} - ${date}`)
		})
		return
	}
	if (version) {
		const command = new Deno.Command(Deno.execPath(), {
			args: [
				'upgrade',
				`${version ? `--version=${version}` : ''}`,
				`${force ? '--force' : ''}`,
				`${quiet ? '--quiet' : ''}`,
			].filter((arg) => arg.length),
		})

		command.spawn()
		return
	}
}

const version = new EnumType(
	denoVersions.map(({ major, minor, patch }) => `${major}.${minor}.${patch}`),
)

export const versionCommand = new Command()
	.name('deno version')
	.version('0.1.0')
	.description('Manage versions of deno executable')
	.type('version', version)
	.option('-f, --force', 'Replace current exe even if not out-of-date')
	.option('-q, --quiet', 'Suppress diagnostic output')
	.option('-l, --list', 'List installed versions', {
		conflicts: ['force', 'quiet'],
	})
	.option('-v, --version [value:version]', 'Version to install', {
		default:
			`${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch}`,
	})
	.action(versionHandler)
