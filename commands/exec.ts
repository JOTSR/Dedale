import { Command } from "../deps.ts";

export function execHandler() {
	throw new Error('Not implemented')
}

export const execCommand = new Command()
	.description('Execute task with the specified task runner')
	.action(execHandler)