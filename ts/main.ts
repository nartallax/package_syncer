import {getCliArgs} from "cli_params"
import {PackageSyncer} from "syncer"
import {watchFileChanges, wrapDumpErrors} from "utils/utils"

export async function mainInternal(): Promise<void> {
	const args = getCliArgs()
	const syncer = new PackageSyncer(args)

	if(args.remember){
		await syncer.backupCurrentFiles()
	}

	if(args.watch){
		args.sourceFiles.forEach(fileName => watchFileChanges(fileName, wrapDumpErrors(async() => {
			await syncer.run()
		})))
	}

	if(!args.remember && !args.skipInitialCheck){
		const hadSync = await syncer.run()
		if(!hadSync){
			console.error("No changes detected in package files.")
		}
	}
}


export const main = wrapDumpErrors(mainInternal)