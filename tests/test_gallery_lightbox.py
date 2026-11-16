from playwright.sync_api import sync_playwright

def test_gear_rack_and_lightbox():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify gear chips
        gear_chips = page.locator(".cp-gear-chip")
        assert gear_chips.count() >= 3
        assert "ARRI Alexa 35" in page.locator(".cp-gear-rack").inner_text()
        
        # Verify gallery stills and lightbox
        shots = page.locator(".cp-shot")
        assert shots.count() == 4
        
        # Click second still to open lightbox
        shots.nth(1).click()
        lightbox = page.locator("#cpLightbox")
        assert lightbox.is_visible()
        assert lightbox.get_attribute("aria-hidden") == "false"
        
        # Navigate with ArrowRight
        img_before = page.locator("#lightboxImg").get_attribute("src")
        page.keyboard.press("ArrowRight")
        img_after = page.locator("#lightboxImg").get_attribute("src")
        assert img_before != img_after
        
        # Close with Escape
        page.keyboard.press("Escape")
        assert not lightbox.is_visible() or lightbox.get_attribute("aria-hidden") == "true"
        
        browser.close()
