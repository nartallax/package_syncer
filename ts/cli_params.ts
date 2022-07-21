import {CLI, CliArgObject} from "utils/cli"

const cli = new CLI({
	helpHeader: "A tool to keep contents of your node_modules in sync with package.json",
	definition: {
		help: CLI.help({
			keys: ["-h", "--h", "-help", "--help"],
			definition: "Display help and exit"
		}),
		sourceFiles: CLI.pathArr({
			keys: ["-s", "--source-file"],
			definition: "What files define contents of node_modules",
			default: ["./package.json", "./package-lock.json"]
		}),
		nodeModulesDir: CLI.path({
			keys: ["-d", "--node-modules"],
			definition: "Where is node_modules directory",
			default: "./node_modules"
		}),
		syncCommand: CLI.str({
			keys: ["-c", "--sync-command"],
			definition: "Shell command that will be used to sync node_modules with package.json",
			default: "npm ci"
		}),
		watch: CLI.bool({
			keys: ["-w", "--watch"],
			definition: "Run continuously, watching source files and syncing as they change"
		})
	}
})

export type SyncerCLIArgs = CliArgObject<typeof cli>

export function getCliArgs(): SyncerCLIArgs {
	return cli.parseArgs()
}