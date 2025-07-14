<script lang="ts">
	import { page } from '$app/state';
</script>

<header>
	<nav>
		<ul>
			<li aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Upload and Search</a>
			</li>
			<li aria-current={page.url.pathname === '/map' ? 'page' : undefined}>
				<a href="/map">Map and Results</a>
			</li>
				<li aria-current={page.url.pathname === '/load' ? 'page' : undefined}>
				<a href="/load">Load Tracks</a>
			</li>
			<li aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">About</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	header {
		display: flex;
		justify-content: center;
		align-items: center;
		background: var(--color-background, #f8f9fa);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		padding: 0 1.5rem;
	}

	nav {
		width: 100%;
		max-width: 900px;
	}

	ul {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
		background: transparent;
	}

	li {
		position: relative;
	}

	li[aria-current='page'] a {
		color: var(--color-theme-1, #0070f3);
		border-bottom: 2px solid var(--color-theme-1, #0070f3);
		background: rgba(0,112,243,0.06);
		border-radius: 4px 4px 0 0;
	}

	nav a {
		display: flex;
		align-items: center;
		padding: 0.75em 1em;
		color: var(--color-text, #222);
		font-weight: 600;
		font-size: 1rem;
		text-transform: none;
		letter-spacing: 0.02em;
		text-decoration: none;
		border-bottom: 2px solid transparent;
		transition: color 0.2s, border-bottom 0.2s, background 0.2s;
		border-radius: 4px 4px 0 0;
	}

	nav a:hover {
		color: var(--color-theme-1, #0070f3);
		background: rgba(0,112,243,0.08);
		border-bottom: 2px solid var(--color-theme-1, #0070f3);
	}
</style>
