from playwright.sync_api import sync_playwright

def test_packages_and_inquiry_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify 3 package tiers
        packages = page.locator(".cp-service")
        assert packages.count() == 3
        assert page.locator(".cp-service.is-main").is_visible()
        
        # Click inquiry button on Half-Day tier
        half_day_btn = packages.nth(0).locator("button[data-request]")
        half_day_btn.click()
        
        # Verify modal opens and scope is pre-populated
        modal = page.locator("#inquiryModal")
        assert modal.is_visible()
        scope_val = page.locator("#inqScope").input_value()
        assert "Half day" in scope_val or "Commercial DP" in scope_val
        
        # Close modal
        page.locator("#closeModalBtn").click()
        assert not modal.is_visible()
        
        # Scroll down and check floating dock appears
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(400)
        dock = page.locator("#cpDock")
        assert dock.is_visible()
        assert "Marcus" in dock.inner_text()
        
        browser.close()
