import { Config, dedale, TemplateActions, JSONTypes } from "../definitions.ts";
import { Command, fs, path } from "../deps.ts";
import { getConfig, getTemplate } from "../utils.ts";

export type Init = {
	template?: string
	directory?: string
	config?: string | Config
	yes: boolean
}

async function initHandler({ directory, template, config, yes = false }: Init, name?: string) {
	//Check flags
	directory ??= Deno.cwd()
	name = (typeof name !== 'string' || name.match(/\w+/)?.[0] !== name) ? path.basename(Deno.cwd()) : name
	config = await getConfig(config)
	template ??= config.defaultTemplate

	//Update dedale global
	dedale.config = config
	dedale.flags.init = { directory, template, config, yes }

	const context = { dedale: dedale, template: {} } as { dedale: typeof dedale, template: Record<string, unknown> }
	let templateConfig = await getTemplate(template, context)

	//Setup directory
	if (directory !== Deno.cwd()) await fs.ensureDir(directory)
	await Deno.writeTextFile(path.join(directory, '.dedale.json'), JSON.stringify(dedale.config), { create: true })
	await fs.copy(path.join(dedale.session.directory.templates, template), directory, { overwrite: false })
	const git = new Deno.Command('git', { args: [ 'init' ] })
	git.spawn()
	git.stdout.pipeTo(Deno.stdout.writable)
	git.stderr.pipeTo(Deno.stderr.writable)
	
	//Execute arguments
	for (const name in templateConfig.arguments) {
		const { type, accepts, description, default: _default, match } = templateConfig.arguments[name]
		console.log(`${name} <${accepts}=${_default}> ${type} - ${description}`)
		const value = (_default !== undefined && yes === false) ? cast(prompt(`? `), type, accepts) : _default
		for (const block of match) {
			if ('default' in block) {
				execute(block.default, directory)
			}
			if ('pattern' in block) {
				if (matchPattern(value, block.pattern)) {
					execute(block.then, directory)
				}
			}
		}
		
		//Update templateConfig with new context
		context.template[name] = value
		templateConfig = await getTemplate(template, context)
	}

	//TODO import and execute used template
	//TODO execute plugins

	console.log(`${name} initialised`)
}

export const initCommand = new Command()
	.description('Init new project')
	.option('-d, --directory <path:file>', 'Directory to setup')
	.option('-t, --template <name:string>', 'Template to use',)
	.option('-c, --config <path:string>', 'Config file to use')
	.option('-y, --yes', 'Skip template queries', { default: false })
	.arguments('[directory-name:string]')
	.action(initHandler)

/**
 * It takes a `TemplateActions` object and a directory, and then it executes the actions on the
 * directory
 * @param {TemplateActions} actions - TemplateActions
 * @param {string} directory - The directory to execute the actions in.
 */
async function execute(actions: TemplateActions, directory: string) {
	for (const action in actions) {
		if (action === 'remove') {
			const globs = actions.remove!
			const regexps = globs.map(glob => path.globToRegExp(glob))
			for await (const file of fs.walk(directory, { match: regexps })) {
				await Deno.remove(file.name, { recursive: true })
			}
		}
		if (action === 'create') {
			for (const path of actions.create!) {
				await fs.ensureFile(path)
			}
		}
		if (action === 'move') {
			for(const [glob1, glob2] of actions.move!) {
				for await (const file of fs.walk(directory, { match: [path.globToRegExp(glob1)] })) {
					//TODO glob1 to glob2 conversion
					await fs.move(file.name, glob2)
				}
			}
		}
	}
	//TODO support pllugins
}
/**
 * It takes a value and a pattern and returns true if the value matches the pattern
 * @param {T} value - The value to match against the pattern.
 * @param {T} pattern - The pattern to match against.
 * @returns A function that takes two arguments, value and pattern, and returns a boolean.
 */
function matchPattern<T = JSONTypes | RegExp>(value: T, pattern: T): boolean {
	if (typeof value === 'string' && typeof pattern === 'string') return value.match(pattern) !== null
	if (typeof value === 'number' && typeof pattern === 'number') return value === pattern
	if (typeof value === 'boolean' && typeof pattern === 'boolean') return value === pattern
	if (Array.isArray(value) && Array.isArray(pattern)) return value.reduce((prev, curr, index) => matchPattern(curr, pattern[index]) && prev, true)
	
	//@ts-ignore JSON value
	const values = Object.entries(value)
	//@ts-ignore JSON value
	const patterns = Object.entries(pattern)
	return values.reduce((prev, curr, index) => 
		curr[0] === patterns[index][0] &&
		matchPattern(curr[1], patterns[index][1]) &&
		prev,
	true)
}

/**
 * It takes a prompt, a type, and an accepts parameter, and returns the prompt casted to the type
 * @param {string | undefined | null} [prompt] - string | undefined | null = ''
 * @param {JSONTypes} type - The type of the value you want to cast to.
 * @param {JSONTypes | RegExp} accepts - JSONTypes | RegExp
 * @returns A function that takes a prompt, type, and accepts.
 */
function cast(prompt: string | undefined | null = '', type: JSONTypes, accepts: JSONTypes | RegExp): JSONTypes {
	// if (typeof accepts === 'string')
	console.log(accepts)
	if (type === 'string') return String(prompt)
	if (type === 'boolean') return Boolean(prompt)
	if (type === 'number') return Number(prompt)
	if (Array.isArray(type)) return JSON.parse(prompt ?? '[]')
	return JSON.parse(prompt ?? '{}')
}
