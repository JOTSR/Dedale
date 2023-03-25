import { xPluginCommand } from './commands/plugin.ts'
import { commitCommand } from './commands/commit.ts'
import { compileCommand } from './commands/compile.ts'
import { versionCommand } from './commands/version.ts'
import { initCommand } from './commands/init.ts'
import { auditCommand } from './commands/audit.ts'
import { execCommand } from './commands/exec.ts'
import { formatCommand } from './commands/format.ts'
import { installCommand } from './commands/install.ts'
import { publishCommand } from './commands/publish.ts'
import { runCommand } from './commands/run.ts'
import { searchCommand } from './commands/search.ts'
import { showCommand } from './commands/show.ts'
import { testCommand } from './commands/test.ts'
import { uninstallCommand } from './commands/uninstall.ts'
import { updateCommand } from './commands/update.ts'
import { upgradeCommand } from './commands/upgrade.ts'
import { configPath, dedale } from './definitions.ts'
import { Command } from './deps.ts'
import { getConfig } from './utils.ts'

dedale.config = await getConfig(configPath)

await new Command()
	.name('dedale')
	.version('0.1.0')
	.description('Project manager for Deno')
	.command('audit', auditCommand)
	.command('commit', commitCommand)
	.command('compile', compileCommand)
	.command('exec', execCommand)
	.command('fmt', formatCommand)
	.command('init', initCommand)
	.command('install', installCommand)
	.command('plugin', xPluginCommand)
	.command('publish', publishCommand)
	.command('run', runCommand)
	.command('search', searchCommand)
	.command('show', showCommand)
	.command('test', testCommand)
	.command('uninstall', uninstallCommand)
	.command('update', updateCommand)
	.command('upgrade', upgradeCommand)
	.command('version', versionCommand)
	.parse(Deno.args)
