from playwright.sync_api import sync_playwright

def test_split_hero_and_shortlist():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Check hero identity elements
        assert page.locator(".cp-name").inner_text().strip() == "Marcus Vance"
        assert "commercial dp" in page.locator(".cp-kicker").inner_text().lower()
        assert page.locator(".cp-trust-ribbon").is_visible()
        
        # Check audio toggle button exists for reels
        audio_btn = page.locator("#cpAudioToggle")
        assert audio_btn.is_visible()
        audio_btn.click()
        assert "Unmuted" in audio_btn.inner_text() or audio_btn.get_attribute("aria-label") == "Mute audio"
        
        # Check shortlist toggle updates localStorage
        save_btn = page.locator("#cpSave")
        save_btn.click()
        assert page.evaluate("() => JSON.parse(localStorage.getItem('nexus_shortlist_v1')).includes('marcus-vance')")
        
        browser.close()
