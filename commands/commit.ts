import { Command, EnumType } from '../deps.ts'

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
	breakingChange: boolean
	body?: string
	footer?: string
}

export function commitHandler({
	type,
	scope,
	breakingChange,
	body,
	footer,
}: Commit, message: unknown) {
	//  if (![
	// 	'build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'
	// ].includes(type)) throw new TypeError(`<${type}> is an uncompatible conventional commit type`)
	const header = [type, scope, breakingChange ? '!' : '', ': ', message].join(
		'',
	)
	const commit = [header, body, footer].join('\n')

	const git = new Deno.Command('git', { args: ['commit', '-m', commit] })
	git.spawn()
	git.stdout.pipeTo(Deno.stdout.writable)
	git.stderr.pipeTo(Deno.stderr.writable)
	/* Conventional commit format

	<type>[optional scope]!: <description>

	[optional body]

	[optional footer(s)]
	*/
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
	.option('-t, --type <commit-type>', 'Conventional commit type', {
		required: true,
	})
	.option('-s, --scope <string>', 'Scope of the commit')
	.option('-k, --breaking-change', 'Includes breaking changes', {
		default: false,
	})
	.option('-b, --body <string>', 'Commit body')
	.option('-f, --footer <string>', 'Commit footer')
	.arguments('<message:string>')
	.action(commitHandler)
