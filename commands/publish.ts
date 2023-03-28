import { Command, EnumType } from '../deps.ts'

export type Publish = {
	type: 'auto' | 'major' | 'minor' | 'patch' | string
	dryRun?: boolean
}

export async function publishHandler(
	{ type, dryRun }: Publish,
	message?: string,
) {
	if (!['auto', 'major', 'minor', 'patch'].includes(type)) {
		console.error(`❌ Publish aborted, unknwon type ${type}`)
	}

	const upType = type as 'auto' | 'major' | 'minor' | 'patch'
	const tags = await (async () => {
		const git = new Deno.Command('git', { args: ['tag', '-l'] })
		const { success, stdout, stderr } = await git.output()
		if (!success) {
			throw new Error('unable to list git tags', {
				cause: new TextDecoder().decode(
					stderr.length ? stderr : stdout,
				),
			})
		}
		if (stdout.length === 0) {
			return [{ prefix: '', major: 0, minor: 0, patch: 0 }]
		}
		const tags = new TextDecoder().decode(stdout)
		return tags.split('\n').map((tag) => {
			const [prefix, major, minor, patch] =
				tag.match(/(\w*)(\d+)\.(\d+)\.(\d+)/) ?? ['', '0', '0', '0']
			return {
				prefix,
				major: parseInt(major),
				minor: parseInt(minor),
				patch: parseInt(patch),
			}
		})
	})()

	const { prefix, ...latest } = tags[0]
	const newLatest = { ...latest }
	if (
		latest.major === 0 && latest.minor === 0 && latest.patch === 0 &&
		upType === 'auto'
	) {
		newLatest.minor = 1
	} else {
		if (upType === 'auto') {
			let commitHash = undefined
			if (
				latest.major !== 0 && latest.minor !== 0 && latest.patch !== 0
			) {
				const gitShow = new Deno.Command('git', {
					args: [
						'show',
						`${prefix}${latest.major}.${latest.minor}.${latest.patch}`,
					],
				})
				const { success, stdout } = await gitShow.output()
				if (!success) {
					console.error(
						`❌ Publish aborted, cant\'t get latest tag commit hash`,
					)
					Deno.exit(1)
				}
				;[commitHash] = new TextDecoder().decode(stdout).match(
					/commit\s(\S+)/,
				) as [string]
			}
			const gitLog = new Deno.Command('git', {
				args: [
					'log',
					'--pretty=format:"%s"',
					commitHash ? `${commitHash}..HEAD` : 'HEAD',
				],
			})
			const { success, stdout, stderr } = await gitLog.output()
			if (!success) {
				console.error(`❌ Publish aborted on git log`)
				console.error(
					new TextDecoder().decode(stdout.length ? stdout : stderr),
				)
				Deno.exit(1)
			}
			let detectedUpType: 'major' | 'minor' | 'patch' = 'patch'
			new TextDecoder().decode(stdout).split('\n').map((commit) =>
				commit.split(':')[0]
			).forEach((type) => {
				//'build', 'chore', 'ci', 'docs', 'fix', 'perf', 'refactor', 'style', 'test'
				if (type.match(/feat|revert/)) {
					if (detectedUpType !== 'major') detectedUpType = 'minor'
				}
				if (type.match(/!/)) {
					detectedUpType = 'major'
				}
			})

			newLatest[detectedUpType] = latest[detectedUpType] + 1
		} else {
			newLatest[upType] = latest[upType] + 1
		}
	}

	if (dryRun) {
		console.log(`🛡️ Dry run`)
		console.log(
			`Update from %c${prefix}${latest.major}.${latest.minor}.${latest.patch}%c to %c${prefix}${newLatest.major}.${newLatest.minor}.${newLatest.patch}`,
			'color: gray; font-weight: bold',
			'',
			'color: green; font-weight: bold',
		)
		return
	}

	const git = new Deno.Command('git', {
		args: [
			'tag',
			`${prefix}${newLatest.major}.${newLatest.minor}.${newLatest.patch}`,
			message ? '-m' : undefined,
			message,
		].filter((arg) => arg !== undefined) as string[],
	})
	const { code, success, stdout, stderr } = await git.output()
	if (success) {
		console.log(
			`Update from %c${prefix}${latest.major}.${latest.minor}.${latest.patch}%c to %c${prefix}${newLatest.major}.${newLatest.minor}.${newLatest.patch}`,
			'color: gray; font-weight: bold',
			'',
			'color: green; font-weight: bold',
		)
		console.log(new TextDecoder().decode(stdout))
	} else {
		console.error(`❌ Publish aborted with code ${code}`)
		console.log(new TextDecoder().decode(stderr.length ? stderr : stdout))
	}
}

export const publishCommand = new Command()
	.description('Create a new flag and push commit to repository')
	.type('release-type', new EnumType(['auto', 'major', 'minor', 'patch']))
	.option(
		'-t, --type <type:release-type>',
		'Type of the version - auto detect the type based on previous commits',
		{ default: 'auto' },
	)
	.option(
		'--dry-run',
		'Dry run publish process',
	)
	.arguments('[message:string]')
	.action(publishHandler)
