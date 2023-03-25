import { DenoLandProvider, UpgradeCommand } from '../deps.ts'

export const upgradeCommand = new UpgradeCommand({
	main: 'main.ts',
	args: ['-A', '--unstable', '--name=dedale', '--quiet', '--no-check'],
	provider: new DenoLandProvider(),
})
	.name('Upgrade Dédale')
	.version('0.1.0')
	.description('Upgrade Dédale cli to specified version')
