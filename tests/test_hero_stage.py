from playwright.sync_api import sync_playwright

def test_split_hero_and_shortlist():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Check hero identity elements
        assert page.locator(".cpx-title").inner_text().strip() == "Marcus Vance"
        assert "commercial dp" in page.locator(".cpx-eyebrow").inner_text().lower()
        assert page.locator(".cpx-facts-grid").is_visible()
        
        # Check reel play/pause toggle button
        play_btn = page.locator("#cpxPlay")
        if play_btn.is_visible():
            play_btn.click()
            page.wait_for_timeout(100)
            assert "Play reel" in play_btn.get_attribute("aria-label") or "Pause reel" in play_btn.get_attribute("aria-label")
        
        # Check shortlist toggle updates localStorage
        save_btn = page.locator("#cpxSave")
        save_btn.click()
        assert page.evaluate("() => JSON.parse(localStorage.getItem('nexus_shortlist_v1')).includes('marcus-vance')")
        
        browser.close()
