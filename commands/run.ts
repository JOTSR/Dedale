import { Command } from "../deps.ts";

export type Run = {
	[name: string]: string[]
}

export function runHandler(flags: Run, script: string, args: Run) {
// 	const command = new Deno.Command(Deno.execPath(), { args: [ 'run', ...flags, script, ...args ] })
// 	command.spawn()
// 	command.stdout.pipeTo(Deno.stdout.writable)
// 	command.stderr.pipeTo(Deno.stderr.writable)
}

export const runCommand = new Command()
	.description('deno run alias')
	// .option('-*, --* <string>', 'Deno run flags', { collect: true })
	// .arguments('<script:file>')
	// .option('* <args:string>', 'Script args', { collect: true })
	// .action(runHandler)