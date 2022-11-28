import { Command, EnumType } from "../deps.ts";

export type Publish = {
	type: 'auto' | 'major' | 'minor' | 'patch' | string
}

export function publishHandler({ type }: Publish, description?: string) {
	throw new Error('Not implemented')
}

export const publishCommand = new Command()
	.description('Create a new flag and push commit to repository')
	.type('versionType', new EnumType([ 'auto', 'major', 'minor', 'patch' ]))
	.option('-t, --type <versionType>', 'Type of the version - auto detect the type based on previous commits', { default: 'auto' })
	.arguments('[description:string]')
	.action(publishHandler)