"""Quick debug: screenshot the app page and capture console errors."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)

    page.goto("http://localhost:3000/app", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)

    # Screenshot
    page.screenshot(path="e:/Vibecode apps/Loteria/tests/debug_screenshot.png", full_page=True)

    # Get page HTML (first 3000 chars)
    html = page.content()[:3000]

    print("=== PAGE HTML (first 3000 chars) ===")
    print(html)
    print()
    print(f"=== CONSOLE ERRORS ({len(errors)}) ===")
    for e in errors[:20]:
        print(e)

    # Check if .bottom-nav exists
    bottom_nav = page.locator(".bottom-nav")
    print(f"\n=== DOM CHECK ===")
    print(f".bottom-nav count: {bottom_nav.count()}")
    print(f".app-header count: {page.locator('.app-header').count()}")

    # Check for buttons
    buttons = page.locator("button").all()
    print(f"Total buttons: {len(buttons)}")
    for b in buttons[:10]:
        print(f"  - {b.inner_text()[:50]}")

    browser.close()
