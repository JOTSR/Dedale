import { Command } from "../deps.ts";

export function upgradeHandler() {
	throw new Error('Not implemented')
}

export const upgradeCommand = new Command()
	.description('Upgrade Dédale')
	.action(upgradeHandler)