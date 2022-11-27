import { Command } from "../deps.ts";

export type Compile = {
	target: typeof Deno.build.target
	entryPoint: string
	outName: string
	icon?: string
	snapshot?: boolean
}

export function compileHandler({
	target,
	entryPoint,
	outName,
	icon,
	snapshot,
}: Compile) {
	throw new Error('Not implemented')
}

export const compileCommand = new Command()
	.description('Compile script to an executable')
	.option('-t, --target <string>', 'Targeted build')
	.option('-e, --entry-point [string]', 'Entry point of the executable', { default: 'main.ts' })
	.option('-i, --icon [file]', 'Icon to use')
	.option('-o, --out-name [string]', 'Executable name')
	.option('-s, --snapshot', 'Use V8 snapshot', { default: false })
	//@ts-ignore bad inference
	.action(compileHandler)