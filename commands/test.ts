import { Command } from "../deps.ts";

export function testHandler() {
	throw new Error('Not implemented')
}

export const testCommand = new Command()
	.description('Execute test with the specified test runner')
	.action(testHandler)