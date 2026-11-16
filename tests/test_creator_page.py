from playwright.sync_api import sync_playwright

def test_explore_to_creator_navigation_and_404():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        
        # 1. Desktop Explore -> Profile Navigation
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:3000/explore")
        first_card = page.locator(".dir-card").first
        first_name = first_card.locator(".ws-name").inner_text().strip()
        first_card.locator(".ws-stage").click()
        page.wait_for_url("**/c/*")
        assert page.locator(".cp-name").inner_text().strip() == first_name
        
        # 2. Check 404 view on unknown slug
        page.goto("http://localhost:3000/c/unknown-creator-xyz")
        assert "couldn't find that creator" in page.locator(".cp-name").inner_text().lower()
        browse_all_btn = page.locator(".cp-missing a")
        assert browse_all_btn.is_visible()
        browse_all_btn.click()
        page.wait_for_url("**/explore")
        
        # 3. Mobile Viewport Layout Verification
        mobile_page = browser.new_page(viewport={"width": 375, "height": 812})
        mobile_page.goto("http://localhost:3000/c/marcus-vance")
        assert mobile_page.locator(".cp-name").is_visible()
        mobile_page.evaluate("window.scrollTo(0, 800)")
        mobile_page.wait_for_timeout(300)
        assert mobile_page.locator("#cpDock").is_visible()
        
        # 4. Multi-creator profile checks (Lookdev, VP, Drone)
        for slug in ["elena-rostova", "kai-tanaka", "maya-lin"]:
            page.goto(f"http://localhost:3000/c/{slug}")
            assert page.locator(".cp-name").is_visible()
            assert page.locator(".cp-gear-rack").is_visible()
            assert page.locator(".cp-shot").count() == 4
        
        browser.close()
