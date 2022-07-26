# Package Syncer

Tool that helps you to keep contents of `package.json` and `node_modules` in sync.  

It's easy to keep them in sync if you're working on a project alone on your only workstation, but if you have multiple of them, or you have colleagues? Then all of those need some way to tell each other that they need to `npm install` packages every time someone installs/updates a package, and that's tedious.  

This tool allows to automate this process. It can run an update command (`npm ci` by default) every time it detects a change in `package.json` or `package-lock.json` (list of files is also configurable). Old versions of those files are stored inside `node_modules`, just to have something to compare current versions against.  

It also has watch mode, for those of us who love continuously-running development scripts that can keep running when you do `git pull`.  

## Install and run

```bash
npm install --save-dev @nartallax/package_syncer
./node_modules/.bin/package_syncer --help
```

## Example

That's how I use this tool in one of my projects:  

```bash
# ...usual stuff, like shebang, cd'ing to proper folder and set -e ...

if [ ! -d "./node_modules" ] ; then
	# it's probably freshly cloned repo! let's just install packages
	npm install
	# then we'll remember current versions of package.json and package-lock.json as correct
	# so this time no immediate re-install of packages will occur
	# also note that we are starting in watchmode
	./node_modules/.bin/package_syncer --remember --watch &
else
	# we already have some packages installed! let's check them
	./node_modules/.bin/package_syncer
	# we do first check separately and then launch tool again, skipping initial check
	# that's because if we have some changes in packages,
	# we want them to be installed before we actually proceed further
	./node_modules/.bin/package_syncer --skip-initial-check --watch &
fi

# at this point we have packages synced and syncer running in watch mode

# ...here we launch other stuff, like development webserver, compiler serivce and so on ...

# wait at the end of the script will help to terminate all the launched tools at once
wait

```

## Options

All of thos options are, well, optional. That is, tool will work just fine without any of those; by default it syncs once and exits.  
(most of stuff below is repeated in `--help`, but anyway, here goes)

### --source-file

Allows to specify a list of files. If any changes are detected between current version of file and backupped version, sync command is issued.  
For multiple files pass this option more than once.  
By default it's just `package.json` and `package-lock.json`.  

### --sync-command

Command that will be used to update packages inside `node_modules`.  
By default it's `npm ci`, but you may use `yarn` or whatever else, in which case you will need to pass something meaningful in this option.  

### --watch

Enables watch mode.  
After initial check the tool won't exit; instead, it will watch for changes in source files, and every time there are any changes - it will issue sync command.  
Intended use-case is to be included as part of scripts that start your compiler, dev webserver and whatever else you need in development. It feels good to just keep them running in background when you do stuff, like `git pull` or whatever else.  

### --node-modules

Path to `node_modules` directory.  
Right now it's not used for anything beside backup files storage, but who knowns.  

### --remember

Copy source files into backup locations before start.  
That way, you're saying "this node_modules are currently in sync with package.json, no need to re-sync". So, this option should be supplied only after `npm install` or something like that.  

### --skip-initial-check

Don't check files initially. Tool will still check files in watch mode if --watch is passed. Initial check is always skipped if --remember passed.  
