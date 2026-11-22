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
        assert hero_card.locator(".ct-hero-top-badge").is_visible()
        assert "Claim a founding spot" in hero_card.locator(".is-hero-cta").inner_text()
        
        # 5. Check Interactive FAQ (Graphic Reference Architecture)
        assert page.locator(".pr-faq-card").is_visible()
        assert page.locator(".pr-faq-giant-title").inner_text().strip() == "FAQ"
        assert "(EVERYTHING YOU NEED TO KNOW)" in page.locator(".pr-faq-tracker").inner_text()
        faq_items = page.locator(".pr-faq-item")
        assert faq_items.count() >= 5
        first_faq = faq_items.first
        assert first_faq.get_attribute("open") is not None
        assert page.locator(".pr-faq-sparkle").count() >= 5
        assert page.locator(".pr-faq-circle-btn").count() >= 5
        
        # Test FAQ Toggle Interaction
        second_faq = faq_items.nth(1)
        assert second_faq.get_attribute("open") is None
        second_faq.locator(".pr-faq-summary").click()
        page.wait_for_timeout(200)
        assert second_faq.get_attribute("open") is not None
        
        # 6. Check Founding Roster Flippable Banner (Parity with Landing Page)
        founding_sec = page.locator("#founding")
        assert founding_sec.is_visible()
        banner = page.locator("#foundingBanner")
        assert banner.is_visible()
        assert "Join the Founding Roster." in page.locator(".nx-found-title").inner_text()
        
        # Test 3D Flip
        flip_btn = page.locator("#founding .nx-found-sec-btn")
        flip_btn.click()
        page.wait_for_timeout(300)
        assert "is-flipped" in banner.get_attribute("class")
        assert page.locator(".nx-criteria-grid").is_visible()
        
        # Test Return Flip
        return_btn = page.locator("#founding .nx-flip-return-btn")
        return_btn.click()
        page.wait_for_timeout(300)
        assert "is-flipped" not in banner.get_attribute("class")

        # 7. Verify Zero Console / Page Errors
        assert len(errors) == 0, f"Encountered console/page errors: {errors}"
        
        browser.close()
