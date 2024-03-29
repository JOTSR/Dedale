export {
	Cell,
	colors as ConsoleColors,
	Command,
	Confirm,
	EnumType,
	Table,
} from 'https://deno.land/x/cliffy@v0.25.4/mod.ts'
export { colors } from 'https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts'
export {
	DenoLandProvider,
	UpgradeCommand,
} from 'https://deno.land/x/cliffy@v0.25.7/command/upgrade/mod.ts'
export * as path from 'https://deno.land/std@0.161.0/path/mod.ts'
export * as fs from 'https://deno.land/std@0.161.0/fs/mod.ts'
export { default as dir } from 'https://deno.land/x/dir@1.5.1/mod.ts'
export { default as username } from 'https://deno.land/x/username@v1.1.1/mod.ts'
export { wait as ConsoleSpinner } from 'https://deno.land/x/wait@0.1.12/mod.ts'
//@ts-ignore ejm.sh resolve and export default
export { default as releases } from 'https://ejm.sh/https://raw.githubusercontent.com/denoland/deno/main/Releases.md' assert { type: 'json' }
export type {
	ModInfoPage,
	Module,
} from 'https://raw.githubusercontent.com/denoland/apiland/1.6.0/types.d.ts'
export { renderMarkdown } from 'https://deno.land/x/charmd@v0.0.2/mod.ts'
