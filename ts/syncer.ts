import {SyncerCLIArgs} from "cli_params"
import {promises as Fs} from "fs"
import * as Path from "path"
import {murmurHash} from "utils/murmur"
import {isEnoent, runCommand} from "utils/utils"

export class PackageSyncer {
	private isSyncing = false
	private shouldSync = false
	private completionWaiters = [] as {ok(result: boolean): void, bad(err: Error): void}[]

	constructor(readonly config: SyncerCLIArgs) {}

	/** Invoke checking process. Can be invoked when process is already running.
	 * Returns when all checks are completed and there is no more checks in queue. */
	run(): Promise<boolean> {
		return new Promise((ok, bad) => {
			this.completionWaiters.push({ok, bad})
			this.shouldSync = true
			if(this.isSyncing){
				return
			}
			this.checkAndSyncWhileHaveFlag()
				.catch(err => this.completeWith(err, false))
		})
	}

	async backupCurrentFiles(): Promise<void> {
		await Promise.all(this.config.sourceFiles.map(async sourceFilePath => {
			const backupFilePath = this.getBackupFilePath(sourceFilePath)
			await Fs.copyFile(sourceFilePath, backupFilePath)
		}))
	}

	private completeWith(err: Error | null, result: boolean): void {
		const waiters = this.completionWaiters
		this.completionWaiters = []
		waiters.forEach(({ok, bad}) => err ? bad(err) : ok(result))
	}

	private async checkAndSyncWhileHaveFlag(): Promise<void> {
		let err: Error | null = null
		let hadSync = false
		try {
			this.isSyncing = true
			while(this.shouldSync){
				this.shouldSync = false
				hadSync = await this.checkAndSyncOnce() || hadSync
			}
		} catch(e){
			if(e instanceof Error){
				err = e
			} else {
				throw e
			}
		} finally {
			this.isSyncing = false
			this.completeWith(err, hadSync)
		}
	}

	private async checkAndSyncOnce(): Promise<boolean> {
		const discrepancies = await this.findDiscrepancies()
		if(discrepancies.length < 1){
			return false
		}
		console.error("Detected changes in " + discrepancies.join("; ") + "; syncing.")
		await this.doSync()
		console.error("Sync completed.")
		return true
	}

	private getBackupFilePath(origFilePath: string): string {
		const hash = murmurHash(origFilePath)
		const name = Path.basename(origFilePath)
		const fileName = "." + (hash + "").replace(/\D/g, "") + "_" + name
		return Path.resolve(
			this.config.nodeModulesDir,
			fileName
		)
	}

	private async findDiscrepancies(): Promise<readonly string[]> {
		const result = [] as string[]
		await Promise.all(this.config.sourceFiles.map(async f => {
			if(await this.hasDiscrepancy(f)){
				result.push(f)
			}
		}))
		return result
	}

	private async hasDiscrepancy(sourceFilePath: string): Promise<boolean> {
		const backupFilePath = this.getBackupFilePath(sourceFilePath)
		try {
			const [origContent, backupContent] = await Promise.all([
				Fs.readFile(sourceFilePath, "utf-8"),
				Fs.readFile(backupFilePath, "utf-8")
			])
			return origContent !== backupContent
		} catch(e){
			if(isEnoent(e)){
				return true
			}
			throw e
		}
	}

	private async rmBackups(): Promise<void> {
		await Promise.all(this.config.sourceFiles.map(async sourceFilePath => {
			const backupFilePath = this.getBackupFilePath(sourceFilePath)
			try {
				await Fs.rm(backupFilePath)
			} catch(e){
				if(!isEnoent(e)){
					throw e
				}
			}
		}))
	}

	private async doSync(): Promise<void> {
		// when command is `npm ci`, it will remove node_modules with our backups, which is ok
		// but the command may be different, like `npm install`
		// so it's better to remove backups by hand
		await this.rmBackups()
		await runCommand(this.config.syncCommand)
		await this.backupCurrentFiles()
	}

}