from playwright.sync_api import sync_playwright

def test_pricing_page_render_and_calculator():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(str(err)))
        
        # 1. Load Pricing Page
        page.goto("http://localhost:3000/pricing", wait_until="networkidle")
        assert "Pricing" in page.title()
        assert page.locator(".ct-title").is_visible()
        assert "One platform. Different economics." in page.locator(".ct-title").inner_text()
        
        # 2. Check Interactive Calculator Initial State ($5k default)
        saved_initial = page.locator("#ctCalcSaved").inner_text().strip()
        assert saved_initial == "+$1,250"
        
        # 3. Test Budget Pill Interaction ($15k)
        pill_15k = page.locator('.ct-calc-pill[data-budget="15000"]')
        assert pill_15k.is_visible()
        pill_15k.click()
        page.wait_for_timeout(100)
        
        saved_new = page.locator("#ctCalcSaved").inner_text().strip()
        assert saved_new == "+$3,750"
        assert "$15,000" in page.locator("[data-calc-budget]").first.inner_text()
        
        # 4. Check 3 Comparison Cards (Freelance, Nexus Hero, Agency)
        cards = page.locator(".ct-card")
        assert cards.count() == 3
        hero_card = page.locator(".ct-card.is-hero")
        assert hero_card.is_visible()
        assert "Nexus" in hero_card.inner_text()
        assert "0% Commission" in hero_card.inner_text()
        
        # 5. Check Comparison Matrix Section
        assert page.locator(".pr-matrix-sec").is_visible()
        assert page.locator(".pr-th-nexus").is_visible()
        assert page.locator(".pr-pill-win").is_visible()
        assert "0% · Keep 100%" in page.locator(".pr-pill-win").inner_text()
        assert page.locator(".pr-table-footer").is_visible()
        
        # 6. Check Interactive FAQ
        faq_items = page.locator(".pr-faq-item")
        assert faq_items.count() >= 5
        first_faq = faq_items.first
        assert first_faq.get_attribute("open") is not None
        
        # 7. Verify Zero Console / Page Errors
        assert len(errors) == 0, f"Encountered console/page errors: {errors}"
        
        browser.close()
