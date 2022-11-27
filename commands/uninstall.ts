export type Uninstall = {
	global: boolean
	dev?: boolean
	packageName: string
}

export function uninstall({ global, dev, packageName }: Uninstall) {
	throw new Error('Not implemented')
}
