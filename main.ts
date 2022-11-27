import { xPluginCommand } from "./commands/plugin.ts";
import { commitCommand } from "./commands/commit.ts";
import { compileCommand } from "./commands/compile.ts";
import { versionCommand } from "./commands/version.ts";
import { initCommand } from "./commands/init.ts";
import { configPath, dedale } from "./definitions.ts";
import { Command } from "./deps.ts";
import { getConfig } from './utils.ts'

dedale.config = await getConfig(configPath)

await new Command()
  .name("dedale")
  .version("0.1.0")
  .description("Project manager for Deno")
  .command('init', initCommand)
  .command('commit', commitCommand)
  .command('version', versionCommand)
  .command('compile', compileCommand)
  .command('plugin', xPluginCommand)
  .parse(Deno.args)