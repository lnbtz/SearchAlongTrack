<script lang="ts">
	import { page } from '$app/state';
	let mobileOpen = $state(false);
	function closeMenu() {
		mobileOpen = false;
	}
	const isActive = (path: string) => (page.url.pathname === path ? 'page' : undefined);
</script>

<header>
	<nav>
		<div class="brand">
			<a class="brand-link" href="/" onclick={closeMenu}>
				<span class="logo">▵</span>
				<span class="title">SearchAlongTrack</span>
			</a>
		</div>

		<button
			class="menu-btn"
			aria-label="Menu"
			aria-expanded={mobileOpen}
			onclick={() => (mobileOpen = !mobileOpen)}
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M3 6h18M3 12h18M3 18h18" />
			</svg>
		</button>

		<ul class="links" class:open={mobileOpen}>
			<li aria-current={isActive('/')}>
				<a href="/" onclick={closeMenu}>Upload & Search</a>
			</li>
			<li aria-current={isActive('/map')}>
				<a href="/map" onclick={closeMenu}>Map & Results</a>
			</li>
			<li aria-current={isActive('/load')}>
				<a href="/load" onclick={closeMenu}>Load Tracks</a>
			</li>
			<li aria-current={isActive('/about')}>
				<a href="/about" onclick={closeMenu}>About</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	header {
		position: sticky;
		top: env(safe-area-inset-top, 0);
		z-index: 100;
		backdrop-filter: saturate(180%) blur(12px);
		background: color-mix(in oklab, var(--bg-elevated) 85%, transparent);
		border-bottom: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		/* keep clear of iOS notch and ensure full visibility */
		padding-top: env(safe-area-inset-top, 0);
	}

	nav {
		margin: 0 auto;
		max-width: 72rem;
		width: 100%;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		box-sizing: border-box;
		position: relative; /* anchor for mobile dropdown */
	}

	.brand-link {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--text);
	}
	.logo {
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		color: white;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%);
		box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
		font-weight: 900;
		transform: translateZ(0);
	}
	.title {
		font-weight: 700;
		letter-spacing: 0.2px;
		font-size: 1.05rem;
	}

	.links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		position: relative;
		border-radius: 10px;
	}

	li[aria-current='page'] a {
		color: var(--primary-700);
		background: color-mix(in oklab, var(--primary) 10%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary) 25%, transparent);
	}

	nav a {
		display: inline-flex;
		align-items: center;
		padding: 0.55rem 0.8rem;
		color: var(--text);
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
		text-decoration: none;
		border-radius: 10px;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.06s ease;
	}

	nav a:hover {
		color: var(--primary-700);
		background: color-mix(in oklab, var(--primary) 8%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary) 20%, transparent);
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		nav {
			padding: 0.5rem 0.75rem;
			gap: 0.5rem;
			flex-wrap: nowrap;
		}
		.title {
			font-size: 0.95rem;
		}
		/* Mobile menu: hide links until opened */
		.menu-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: transparent;
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 0.35rem;
			color: var(--text);
		}
		.links {
			display: none;
			position: absolute;
			left: 0;
			right: 0;
			top: 100%;
			background: var(--bg-elevated);
			border-bottom: 1px solid var(--border);
			box-shadow: var(--shadow-md);
			padding: 0.5rem;
			gap: 0.25rem;
			flex-direction: column;
			align-items: stretch;
		}
		.links.open {
			display: flex;
		}
		.links li {
			width: 100%;
		}
		.links a {
			width: 100%;
			justify-content: flex-start;
		}
		/* keep active route visibly highlighted in the mobile list */
		.links li[aria-current='page'] a {
			background: color-mix(in oklab, var(--primary) 12%, transparent);
			box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary) 25%, transparent);
			color: var(--primary-700);
		}
		.links li {
			flex: 0 0 auto;
		}
		nav a {
			padding: 0.45rem 0.6rem;
			font-size: 0.9rem;
		}
	}

	@media (min-width: 641px) {
		.menu-btn {
			display: none;
		}
	}
</style>
