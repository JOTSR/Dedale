import {
	Config,
	dedale,
	ImportMapEntry,
	Template,
	TemplateActions,
} from './definitions.ts'
import { ConsoleColors, ConsoleSpinner, fs, path } from './deps.ts'

/**
 * It reads a template file, replaces all variables with their values, and returns the template
 * @param {string} path - The path to the template file
 * @param context - Record<string, unknown> = {}
 * @returns A promise that resolves to a Template object.
 */
export async function readTemplateFile(
	path: string,
	context: Record<string, unknown> = {},
): Promise<Template> {
	const raw = await Deno.readTextFile(path)
	const json = (await JSON.parse(raw)) as Template

	context.name = json.name

	return {
		name: json.name,
		arguments: replaceTemplateArguments(json, context),
		use: replaceTemplateUse(json, context),
		plugins: replaceTemplatePlugins(json, context),
	}
}

/**
 * It reads a JSON file, parses it, and returns a strongly typed object
 * @param {string} path - The path to the config file.
 * @returns The return type is a promise that resolves to a Config object.
 */
export async function readConfigFile(path: string): Promise<Config> {
	const raw = await Deno.readTextFile(path)
	const json = (await JSON.parse(raw)) as Config
	return {
		defaultTemplate: json.defaultTemplate,
		defaultProvider: json.defaultProvider,
		providers: json.providers,
		autoUpdate: json.autoUpdate,
		notifyUpdate: json.notifyUpdate,
		plugins: json.plugins,
		autoUpgrade: json.autoUpgrade,
		notifyUpgrade: json.notifyUpgrade,
	} as const
}

/**
 * It returns a template object from a template name or default
 * @param {string | undefined} value - The value of the template parameter.
 * @param context - Record<string, unknown> = {}
 * @returns A promise that resolves to a Template object.
 */
export async function getTemplate(
	value: string | undefined,
	context: Record<string, unknown>,
): Promise<Template> {
	if (typeof value === 'string') {
		return await readTemplateFile(
			path.join(
				dedale.session.directory.templates,
				value,
				'dedale.template.json',
			),
			context,
		)
	}
	return await getTemplate(dedale.config?.defaultTemplate, context)
}

/**
 * It returns a config object, either from a file, or from the session's config file, or from the
 * argument
 * @param {string | Config | undefined} value - The value to be converted to a Config object.
 * @returns A promise that resolves to a Config object.
 */
export async function getConfig(
	value: string | Config | undefined,
): Promise<Config> {
	if (typeof value === 'string') return await readConfigFile(value)
	if (typeof value === 'undefined') {
		return await getConfig(dedale.session.directory.config)
	}
	return value
}

/**
 * It replaces all variables in a string with their corresponding values
 * @param {T} reference - T
 * @param variables - Record<string, unknown>
 * @returns The return type is T.
 */
function replaceVariables<T>(
	reference: T,
	variables: Record<string, unknown>,
): T {
	if (typeof reference !== 'string' || !reference.match(/\$((\w+)\.?)+/g)) {
		return reference
	}
	const [variable, ...properties] = reference.slice(1).split('.')
	return properties.reduce(
		(previous, current) => (previous as Record<string, unknown>)[current],
		variables[variable],
	) as T
}

/**
 * It takes a TemplateActions object and a Record of variables, and returns a TemplateActions object
 * with all the variables replaced
 * @param {TemplateActions} actions - TemplateActions - The actions to replace the variables in.
 * @param variables - Record<string, unknown>
 * @returns An object with the same keys as the input object, but with the values replaced.
 */
function replaceTemplateActions(
	actions: TemplateActions,
	variables: Record<string, unknown>,
): TemplateActions {
	return {
		move: actions.move?.map(([glob1, glob2]) => [
			replaceVariables(glob1, variables),
			replaceVariables(glob2, variables),
		]),
		remove: actions.remove?.map((glob) =>
			replaceVariables(glob, variables)
		),
		create: actions.create?.map((glob) =>
			replaceVariables(glob, variables)
		),
		plugins: actions.plugins?.map((plugin) => {
			return {
				name: plugin.name,
				arguments: plugin.arguments.map((arg) =>
					replaceVariables(arg, variables)
				),
			}
		}),
	}
}

/**
 * It replaces the variables in the default value and the pattern of each match, and then it replaces
 * the variables in the actions of each match
 * @param {Template}  - `template`: The template to replace the variables in.
 * @param context - The context of the template.
 * @returns An object with the same keys as the original object, but with the values replaced.
 */
function replaceTemplateArguments(
	{ arguments: args }: Template,
	context: Record<string, unknown>,
): Template['arguments'] {
	if (args === undefined) return undefined
	const entries = Object.entries(args)
	const replaced = entries.map(([name, properties]) => {
		const _default = replaceVariables(properties.default, context)
		const match = properties.match.map((value) => {
			if ('default' in value) {
				return {
					default: replaceTemplateActions(
						value.default,
						context,
					),
				}
			}
			return {
				pattern: replaceVariables(value.pattern, context),
				then: replaceTemplateActions(value.then, context),
			}
		})
		context[name] = { default: _default, match } //Update context at each arg
		return [name, { default: _default, match }]
	})
	return Object.fromEntries(replaced)
}

/**
 * It replaces all variables in a template's `use` property with their values from the context
 * @param {Template}  - `template`: The template to replace variables in.
 * @param context - The context object that contains the variables to replace.
 * @returns A Template['use']
 */
function replaceTemplateUse(
	{ use }: Template,
	context: Record<string, unknown>,
): Template['use'] {
	if (use === undefined) return undefined
	const name = use.name
	const args = Object.fromEntries(
		Object.entries(use.arguments).map(([name, value]) => [
			name,
			replaceVariables(value, context),
		]),
	)
	const include = use.include?.map((glob) => replaceVariables(glob, context))
	const exclude = use.exclude?.map((glob) => replaceVariables(glob, context))
	const replace = use.replace?.map(([glob1, glob2]) => [
		replaceVariables(glob1, context),
		replaceVariables(glob2, context),
	]) as [string, string][]
	return { name, arguments: args, include, exclude, replace }
}

/**
 * It takes a template and a context, and returns a new template with the variables in the template
 * replaced with the values in the context
 * @param {Template}  - `template`: The template to replace the variables in.
 * @param context - The context object that contains the variables to replace.
 * @returns A template with the variables replaced.
 */
function replaceTemplatePlugins(
	{ plugins }: Template,
	context: Record<string, unknown>,
): Template['plugins'] {
	if (plugins === undefined) return undefined
	return plugins.map((plugin) => {
		const name = plugin.name
		const args = plugin.arguments.map((arg) =>
			replaceVariables(arg, context)
		)
		return { name, arguments: args }
	})
}

/**
 * Encapse messages stack with a spinner for the current step
 */
export class LoadInfo {
	#spinner: ReturnType<typeof ConsoleSpinner>
	#sub = false
	#subMessage?: string
	#mainMessage?: string

	/**
	 * The constructor function takes an optional parameter, `indent`, which is used to indent the
	 * spinner
	 */
	constructor() {
		this.#spinner = ConsoleSpinner('')
	}

	#start = () => {
		this.#spinner.start()
		this.#start = () => undefined
	}

	/**
	 * It prints a message to the console with a spinner and push the old message above, it also prints the
	 * current step and the total number of steps
	 * @param {string} message - string - The message to display
	 * @param [step] - { current: number, total: number }
	 */
	push(
		message: string,
		step?: { current: number; total: number },
		sub = false,
	): void {
		this.#start()
		if (this.#spinner.text && !sub) {
			console.log(
				`${
					ConsoleColors.bold.rgb24('Done', 0x00cc88)
				} ${this.#mainMessage}`,
			)
			if (this.#subMessage) console.log('\n')
		}

		if (sub) {
			this.#subMessage = (step === undefined)
				? message
				: `${message} [${step.current}/${step.total}]`
		} else {
			this.#subMessage = undefined
			this.#mainMessage = (step === undefined)
				? message
				: `${message} [${step.current}/${step.total}]`
		}
		this.#spinner.text = [this.#mainMessage, this.#subMessage].join('\n\t')
	}

	/**
	 * The `clear()` function stops the spinner
	 */
	clear() {
		this.#spinner.stop()
	}
}

export class ImportMap {
	static #path: string
	static get path() {
		if (this.#path) return this.#path
		const root = dedale.project.path
		if (root === undefined) {
			throw new Error('unknown project path')
		}
		for (
			const file of fs.expandGlobSync(
				path.join(root, 'import[-_]map.json'),
			)
		) {
			if (file.isFile) {
				this.#path = file.path
				break
			} else {
				const importMap = { imports: {}, scopes: {} }
				Deno.writeTextFileSync(
					'import_map.json',
					JSON.stringify(importMap, null, 2),
				)
				this.#path = 'import_map.json'
				break
			}
		}
		return this.#path
	}
	static async get(): Promise<ImportMapEntry[]> {
		const raw = await Deno.readTextFile(this.path)
		const json = JSON.parse(raw) as {
			imports: Record<string, string>
			scopes: Record<string, Record<string, string>>
		}
		const entries = Object.entries(json.imports).map(([name, path]) => ({
			name,
			path,
			kind: this.#entryKind(name),
		}))
		return entries
	}

	static async set(...entries: ImportMapEntry[]): Promise<void> {
		const importMap = await this.get()
		for (const entry of entries) {
			if (importMap.map(({ path }) => path).includes(entry.path)) {
				throw new Error(`duplicated path ${entry.path}`)
			}
			if (
				importMap.map(({ kind, name }) => `${kind}:${name}`).includes(
					`${entry.kind}:${entry.name}`,
				)
			) {
				const entryIndex = importMap.findIndex(({ kind, name }) =>
					`${kind}:${name}` === `${entry.kind}:${entry.name}`
				)
				importMap.with(entryIndex, entry)
				continue
			}
			importMap.push(entry)
		}
		const raw = await Deno.readTextFile(this.path)
		const json = JSON.parse(raw) as {
			imports: Record<string, string>
			scopes: Record<string, Record<string, string>>
		}
		json.imports = Object.fromEntries(
			importMap.map(({ name, kind, path }) => [`${kind}:${name}`, path]),
		)
		await Deno.writeTextFile(this.path, JSON.stringify(raw, null, 2))
	}

	static async delete(
		...entries: Omit<ImportMapEntry, 'path'>[]
	): Promise<void> {
		let importMap = await this.get()
		for (const entry of entries) {
			if (
				!importMap.map(({ kind, name }) => `${kind}:${name}`).includes(
					`${entry.kind}:${entry.name}`,
				)
			) {
				throw new Error(`unknown entry ${entry.kind}:${entry.name}`)
			}
			importMap = importMap.filter(({ kind, name }) =>
				`${kind}:${name}` !== `${entry.kind}:${entry.name}`
			)
		}
		const raw = await Deno.readTextFile(this.path)
		const json = JSON.parse(raw) as {
			imports: Record<string, string>
			scopes: Record<string, Record<string, string>>
		}
		json.imports = Object.fromEntries(
			importMap.map(({ name, kind, path }) => [`${kind}:${name}`, path]),
		)
		await Deno.writeTextFile(this.path, JSON.stringify(raw, null, 2))
	}

	static #entryKind(name: string): ImportMapEntry['kind'] {
		if (name.startsWith('dev:')) return 'dev'
		if (name.startsWith('asset:')) return 'asset'
		return null
	}
}
