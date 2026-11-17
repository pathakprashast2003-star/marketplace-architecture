from playwright.sync_api import sync_playwright

def test_gear_rack_and_lightbox():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify gear hardware manifest
        gear_cells = page.locator(".cpx-kit-cell")
        assert gear_cells.count() >= 3
        assert "ARRI Alexa 35" in page.locator(".cpx-kit-grid").inner_text()
        
        # Verify gallery stills and lightbox
        shots = page.locator(".cpx-thumb")
        assert shots.count() >= 4
        
        # Click second still to open lightbox
        shots.nth(1).click()
        lightbox = page.locator("#cpxLb")
        assert not lightbox.is_hidden()
        
        # Navigate with ArrowRight
        img_before = lightbox.locator("img").get_attribute("src")
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(100)
        img_after = lightbox.locator("img").get_attribute("src")
        assert img_before != img_after
        
        # Close with Escape
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        assert lightbox.is_hidden()
        
        browser.close()
