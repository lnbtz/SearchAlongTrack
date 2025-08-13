export function getCategoryIconUrl(category?: string): string {
	const filename = category && category.length > 0 ? category : 'default';
	return `/icons/new_icons/${filename}.png`;
}
