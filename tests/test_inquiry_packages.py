from playwright.sync_api import sync_playwright

def test_packages_and_inquiry_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:3000/c/marcus-vance")
        
        # Verify services rate matrix rows
        services = page.locator(".cpx-svc-row")
        assert services.count() >= 3
        
        # Click request button on first tier
        first_req_btn = services.nth(0).locator("button[data-request]")
        first_req_btn.click()
        
        # Verify modal opens and scope is pre-populated
        modal = page.locator("#inquiryModal")
        assert modal.is_visible()
        scope_val = page.locator("#inqScope").input_value()
        assert "Half day" in scope_val or "Commercial DP" in scope_val
        
        # Close modal
        page.locator("#closeModalBtn").click()
        page.wait_for_timeout(200)
        assert not modal.is_visible()
        
        # Verify sticky card request button also opens modal
        card_btn = page.locator(".cpx-card button[data-request]")
        card_btn.click()
        page.wait_for_timeout(200)
        assert modal.is_visible()
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        assert not modal.is_visible()
        
        browser.close()
