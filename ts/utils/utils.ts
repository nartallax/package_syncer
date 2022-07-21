import * as ChildProcess from "child_process"
import * as Fs from "fs"
import * as ShellQuote from "shell-quote"

export function isEnoent(err: unknown): err is Error & {code: "ENOENT"} {
	return err instanceof Error && (err as Error & {code: string}).code === "ENOENT"
}

export function runCommand(cmd: string): Promise<void> {
	return new Promise((ok, bad) => {
		const args = ShellQuote.parse(cmd) as string[]
		args.forEach(arg => {
			if(typeof(arg) !== "string"){
				throw new Error("Unexpected part of shell command: " + JSON.stringify(arg) + " (the whole command is " + cmd + ")")
			}
		})
		if(args.length < 1){
			throw new Error("Failed to parse shell command " + cmd + ": it consists of zero parts.")
		}
		const process = ChildProcess.spawn(args[0]!, args.slice(1), {
			stdio: "inherit"
		})
		process.on("error", err => bad(err))
		process.on("exit", code => {
			if(code !== null && code !== 0){
				bad(new Error("Exit code of " + cmd + " is nonzero: " + code))
				return
			}
			ok()
		})
	})
}

export function watchFileChanges(path: string, callback: () => void): void {
	Fs.watchFile(path, {
		persistent: true
	}, (curr, prev) => {
		if(curr.mtimeMs === prev.mtimeMs){
			return // no modification was made, skipping
		}
		callback()
	})
}

export function wrapDumpErrors(fn: () => Promise<void>): () => Promise<void> {
	return async() => {
		try {
			await fn()
		} catch(e){
			console.error(e instanceof Error ? e.stack || e.message : e + "")
		}
	}
}