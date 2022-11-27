export type Publish = {
	type: 'auto' | 'major' | 'minor' | 'patch'
	message?: string
}

export function publish({ type, message }: Publish) {
	throw new Error('Not implemented')
}
