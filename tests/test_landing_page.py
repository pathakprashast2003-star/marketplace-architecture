import pytest
from playwright.sync_api import sync_playwright

def test_landing_page_editorial_standards():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Listen for any console errors or page exceptions
        page.on("console", lambda msg: errors.append(f"Console: {msg.text}") if msg.type in ["error"] else None)
        page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))
        
        # 1. Load Landing Page
        res = page.goto("http://localhost:3000/", wait_until="networkidle")
        assert res.status == 200, f"Expected 200, got {res.status}"
        assert "Nexus" in page.title()
        
        # 2. Canonical Top Navigation
        nav = page.locator(".nx-explore-nav")
        assert nav.is_visible()
        assert page.locator(".nx-nav-brand").inner_text().strip() == "nexus."
        assert page.locator(".nx-nav-link.is-active").inner_text().strip() == "Home"
        
        # 3. Editorial Masthead
        h1 = page.locator(".nx-hero-h1")
        assert h1.is_visible()
        assert "direct access to the top" in h1.inner_text().lower()
        assert "1% independent" in h1.inner_text().lower()
        
        # 4. Search Omnibox & Shortcuts
        omnibox = page.locator("#nxHeroSearchInput")
        assert omnibox.is_visible()
        assert page.locator(".nx-hero-chip").count() >= 4
        
        # 5. Cinema Showreel Stage & Video
        video = page.locator("#nxCinemaVideo")
        assert video.is_visible()
        
        # Initial creator is Marcus Vance
        assert page.locator("#nxCinemaName").inner_text().strip() == "Marcus Vance"
        assert "$650" in page.locator("#nxCinemaRateVal").inner_text()
        
        # 6. Interactive Talent Switching
        elena_tab = page.locator("button[data-talent='elena']")
        assert elena_tab.is_visible()
        elena_tab.click()
        page.wait_for_timeout(300)
        
        # Verified switch
        assert elena_tab.get_attribute("aria-selected") == "true"
        assert page.locator("#nxCinemaName").inner_text().strip() == "Elena Rostova"
        assert "$950" in page.locator("#nxCinemaRateVal").inner_text()
        assert "elena-rostova" in page.locator("#nxCinemaProfileLink").get_attribute("href")
        
        # Check Kai Tanaka switch
        kai_tab = page.locator("button[data-talent='kai']")
        kai_tab.click()
        page.wait_for_timeout(300)
        assert page.locator("#nxCinemaName").inner_text().strip() == "Kai Tanaka"
        assert "$800" in page.locator("#nxCinemaRateVal").inner_text()
        
        # 7. Zero Console Errors
        assert len(errors) == 0, f"Encountered errors: {errors}"
        
        browser.close()
