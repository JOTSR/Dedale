import { Init } from './commands/init.ts'
import { dir, path, username } from './deps.ts'

/**
 * Dédale configuration interface
 */
export interface Config {
	//Templates
	/**
	 * Default template name of definition
	 *
	 * @example "vscode-mod"
	 */
	defaultTemplate: string

	//Packages
	/**
	 * Default modules provider url
	 *
	 * @example "https://deno.land/x"
	 */
	defaultProvider: string

	/**
	 * List of providers
	 *
	 * @example { "deno-std" : "https://deno.land/std", "deno-x": "https://deno.land/x", "esm": "https://esm.sh" }
	 */
	providers: Record<string, string>

	/**
	 * Automatic update of deno
	 * Set defaultVersion to the latest
	 */
	autoUpdate: boolean

	/**
	 * Notify newer deno version when cli is used
	 */
	notifyUpdate: boolean

	//Plugins
	/**
	 * Plugins installed and activation status
	 * Automatically generated
	 * Default state of plugins is activated
	 *
	 * @example { "readme-generator", { "path": "$dedale.pluginsDirectory/readme-generator", "activated": true } }
	 */
	plugins: Record<string, { path: string; activated: boolean }>

	//Upgrade
	/**
	 * Automatic upgrade of dédale
	 */
	autoUpgrade: boolean

	/**
	 * Notify newer dédale version when cli is used
	 */
	notifyUpgrade: boolean
}

type _JSONTypes = string | boolean | number | JSONTypes[]
export type JSONTypes =
	| _JSONTypes
	| Record<string, _JSONTypes>
	| Record<string, _JSONTypes>[]

type GlobExp = string

/**
 * Actions executed by the template
 * Actions are executed in the order used in the json file
 */
export interface TemplateActions {
	/**
	 * File or directory to move/rename (like mv -f glob1 glob2)
	 * List be an array of tuple of [glob, glob]
	 *
	 * @examples [["deno.unstable.json", "deno.json"]]
	 */
	move?: [GlobExp, GlobExp][]
	/**
	 * File or directory to remove (like rm -rf glob1 glob2)
	 * List be an array of glob expressions
	 *
	 * @examples ["deno.stable.json"]
	 */
	remove?: GlobExp[]
	/**
	 * File or directory to create (like mkdir -d glob)
	 * List be an array of glob explressions
	 *
	 * @examples ["LICENCE"]
	 */
	create?: GlobExp[]
	/**
	 * Plugins to use
	 */
	plugins?: {
		/**
		 * Plugin name
		 *
		 * @example "readme-generator"
		 * @item { "type": "string", "pattern": "([-\w])+" }
		 */
		name: string
		/**
		 * Arguments of the plugin
		 * Can be any valid json type
		 * Variables are accessible via $
		 *
		 * @example "string"
		 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
		 */
		arguments: JSONTypes[]
	}[]
}

/**
 * Template for directory initialisation
 */
export interface Template {
	/**
	 * Name of the template
	 *
	 * @example "vscode-mod"
	 * @item { "type": "string", "pattern": "([-\w])+" }
	 */
	name: string
	/**
	 * CLI arguments required by the template on directory init
	 */
	arguments?: {
		/**
		 * Name of the argument
		 *
		 * @example "licence"
		 * @item { "type": "string", "pattern": "([-\.\w])+" }
		 */
		[name: string]: {
			/**
			 * Type of the argument
			 * Can be any valid json type
			 * String can be a regex pattern (eg: ([A-Z])\w+)
			 *
			 * @example "string"
			 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
			 */
			type: JSONTypes
			/**
			 * Value to accept
			 * Can be any valid json type
			 * String can be a regex pattern (eg: ([A-Z])\w+)
			 *
			 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
			 */
			accepts: JSONTypes | RegExp
			/**
			 * Description of the argument
			 * @example "Licence of the repository"
			 */
			description: string
			/**
			 * Default value of the argument
			 * If not set argument is mandatory
			 * Variables are accessible via $
			 *
			 * Can be any valid json type
			 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
			 */
			default?: JSONTypes
			/**
			 * Actions to execute when argument match a specific value
			 * Pattern are checked in order
			 */
			match:
				| [
					...{
						/**
						 * Pattern of the argument
						 * Can be any valid json type
						 * String can be a regex pattern (eg: ([A-Z])\w+)
						 * Variables are accessible via $
						 *
						 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
						 */
						pattern: JSONTypes | RegExp
						/**
						 * Actions are executed in order
						 */
						then: TemplateActions
					}[],
					{
						/**
						 * Actions are executed in order
						 */
						default: TemplateActions
					},
				]
				| {
					/**
					 * Pattern of the argument
					 * Can be any valid json type
					 * String can be a regex pattern (eg: ([A-Z])\w+)
					 * Variables are accessible via $
					 *
					 * @item { "type": "string", "enum": [ "string", "boolean", "number", "array", "object" ] }
					 */
					pattern: JSONTypes | RegExp
					/**
					 * Actions are executed in order
					 */
					then: TemplateActions
				}[]
		}
	}
	/**
	 * Template which is based on
	 */
	use?: {
		/**
		 * Name of the used template
		 *
		 * @example "vscode-mod"
		 * @item { "type": "string", "pattern": "([-\w])+" }
		 */
		name: string
		/**
		 * Arguments required by the used template
		 * Value can by passed or arguments can be mapped
		 * Variables are accessible via $
		 *
		 * @example { "description": "$template.description", "unstable": true }
		 */
		arguments: {
			[name: string]: string
		}
		/**
		 * Files to include from the source template
		 * List must be an array of glob expressions
		 *
		 * @examples [ ".vscode", "src/*" ]
		 */
		include?: GlobExp[]
		/**
		 * Files to exclude from the source template
		 * List must be an array of glob expressions
		 *
		 * @examples [ "*json" ]
		 */
		exclude?: GlobExp[]
		/**
		 * Files to replace from the source template
		 * List must be an array of tuple of [glob, glob]
		 *
		 * @examples [[ "deno.json*", "deno.jsonc" ]]
		 */
		replace?: [GlobExp, GlobExp][]
	}
	/**
	 * Plugins to use
	 */
	plugins?: TemplateActions['plugins']
}

/*
{
    templates
    replace {{ argument }} in *.template
}
*/

export interface Dedale {
	config?: Config
	session: {
		username: string
		home: string
		build: typeof Deno.build
		directory: {
			root: string
			templates: string
			config: string
		}
	}
	project: {
		name?: string
		path?: string
	}
	flags: {
		init?: Init
	}
	template?: Template
}

const userDirectory = ((_) => {
	const home = dir('home')
	if (home === null) throw new Error('Unable to find home directory')
	return home
})()

export const dedale: Dedale = {
	session: {
		username: (await username()) ?? '',
		home: userDirectory,
		build: Deno.build,
		directory: {
			root: path.join(userDirectory, '.dedale'),
			templates: path.join(userDirectory, '.dedale', 'templates'),
			config: path.join(userDirectory, '.dedale', '.dedale.json'),
		},
	},
	project: {},
	flags: {},
}

export const configPath = await (async () => {
	try {
		const config = path.join(Deno.cwd(), '.dedale.json')
		await Deno.readTextFile(config)
		return config
	} catch {
		return path.join(dedale.session.home, '.dedale', '.dedale.json')
	}
})()

export type Tree = {
	[key: string]:
		| {
			file: string
		}
		| {
			dir: string
			tree?: Tree
		}
}

export const tree: Tree = {
	config: {
		file: '.dedale.json',
	},
	folder: {
		dir: '.dedale',
		tree: {
			plugins: {
				dir: 'plugins',
			},
			templates: {
				dir: 'templates',
			},
		},
	},
}

export type ImportMapEntry = {
	name: string
	kind: 'dev' | 'asset' | null
	path: string
}
