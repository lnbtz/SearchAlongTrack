<script lang="ts">
	import { page } from '$app/state';
</script>

<header>
    <nav>
        <div class="brand">
            <a class="brand-link" href="/">
                <span class="logo">▵</span>
                <span class="title">SearchAlongTrack</span>
            </a>
        </div>
        <ul class="links">
            <li aria-current={page.url.pathname === '/' ? 'page' : undefined}>
                <a href="/">Upload & Search</a>
            </li>
            <li aria-current={page.url.pathname === '/map' ? 'page' : undefined}>
                <a href="/map">Map & Results</a>
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
        position: sticky;
        top: 0;
        z-index: 30;
        backdrop-filter: saturate(180%) blur(12px);
        background: color-mix(in oklab, var(--bg-elevated) 75%, transparent);
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
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
        transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.06s ease;
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
            flex-wrap: wrap;
        }
        .title {
            font-size: 0.95rem;
        }
        .links {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            justify-content: flex-start;
            gap: 0.25rem;
        }
        .links li {
            flex: 0 0 auto;
        }
        nav a {
            padding: 0.45rem 0.6rem;
            font-size: 0.9rem;
        }
    }
</style>
