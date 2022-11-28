import { Command } from "../deps.ts";

export function auditHandler() {
	throw new Error('Not implemented')
}

export const auditCommand = new Command()
	.description('Security audit')
	.action(auditHandler)