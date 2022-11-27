export type Install = {
	global?: boolean
	dev?: boolean
	provider?: URL
	packageName: string
}

export function install({ global, dev, provider, packageName }: Install) {
	throw new Error('Not implemented')
}
