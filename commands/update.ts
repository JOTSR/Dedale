export type Update = {
	global?: boolean
	dev?: boolean
	packageName: string
}

export function update({ global, dev, packageName }: Update) {
	throw new Error('Not implemented')
}
