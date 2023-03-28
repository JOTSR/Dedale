import { Cell, Command, Confirm, EnumType, Table } from '../deps.ts'

export type Commit = {
	type:
		| 'build'
		| 'chore'
		| 'ci'
		| 'docs'
		| 'feat'
		| 'fix'
		| 'perf'
		| 'refactor'
		| 'revert'
		| 'style'
		| 'test'
		| string
	scope?: string
	breakingChange?: boolean
	body?: string
	footer?: string
}

export async function commitHandler({
	type,
	scope,
	breakingChange,
	body,
	footer,
}: Commit, message: string) {
	//  if (![
	// 	'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'
	// ].includes(type)) throw new TypeError(`<${type}> is an uncompatible conventional commit type`)
	if (message.toLocaleLowerCase() !== message) {
		const keep = await Confirm.prompt({
			message: `⚠️ Header is not in lower case, keep commit message?`,
			default: false,
		})
		if (!keep) {
			console.error('❌ Commit aborted')
			return
		}
	}

	const header = [
		type,
		scope ? `(${scope})` : '',
		breakingChange ? '!' : '',
		': ',
		message,
	].join(
		'',
	)

	if (header.length > 50) {
		const keep = await Confirm.prompt({
			message:
				`⚠️ Header length is ${header.length}/50, keep commit message?`,
			default: false,
		})
		if (!keep) {
			console.error('❌ Commit aborted')
			return
		}
	}

	const commit = [header, body, footer]
		.filter((line) => line !== undefined && line.length !== 0)
		.join('\n\n')

	const git = new Deno.Command('git', { args: ['commit', '-m', commit] })
	const { code, success, stdout, stderr } = await git.output()
	if (success) {
		new Table().body([
			[new Cell('✔️ Message commited').colSpan(2)],
			['header', header],
			['body', body],
			['footer', footer],
		]).border(true).render()
		console.log(new TextDecoder().decode(stdout))
	} else {
		console.error(`❌ Commit aborted with code ${code}`)
		console.log(new TextDecoder().decode(stderr.length ? stderr : stdout))
	}
}

export const commitCommand = new Command()
	.description('Commit changes')
	.type(
		'commit-type',
		new EnumType([
			'build',
			'chore',
			'ci',
			'docs',
			'feat',
			'fix',
			'perf',
			'refactor',
			'revert',
			'style',
			'test',
		]),
	)
	.option('-t, --type <type:commit-type>', 'Conventional commit type', {
		required: true,
	})
	.option('-s, --scope <string>', 'Scope of the commit')
	.option('-k, --breaking-change', 'Includes breaking changes?')
	.option('-b, --body <string>', 'Commit body')
	.option('-f, --footer <string>', 'Commit footer')
	.arguments('<message:string>')
	.action(commitHandler)
