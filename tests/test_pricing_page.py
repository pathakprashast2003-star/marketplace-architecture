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

        # 7. Check Section Ordering: #founding must sit above #faq
        is_faq_following_founding = page.evaluate(
            "() => !!(document.getElementById('founding').compareDocumentPosition(document.getElementById('faq')) & Node.DOCUMENT_POSITION_FOLLOWING)"
        )
        assert is_faq_following_founding, "Expected #founding to be placed above #faq in DOM"
        founding_box = founding_sec.bounding_box()
        faq_box = page.locator("#faq").bounding_box()
        assert founding_box["y"] < faq_box["y"], "Expected #founding visual position to be above #faq"

        # 8. Verify Zero Console / Page Errors
        assert len(errors) == 0, f"Encountered console/page errors: {errors}"
        
        browser.close()


def test_pricing_page_mobile_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 853})
        
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(str(err)))
        
        page.goto("http://localhost:3000/pricing", wait_until="networkidle")
        
        # 1. Verify no horizontal overflow
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        client_width = page.evaluate("() => document.documentElement.clientWidth")
        assert scroll_width <= client_width + 1, f"Horizontal overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}"
        
        # 2. Verify calculator bar has clean card radius on mobile (not 9999px oval)
        calc_radius = page.evaluate("() => window.getComputedStyle(document.querySelector('.ct-calc-bar')).borderRadius")
        assert calc_radius == "20px", f"Expected 20px card radius on mobile, got {calc_radius}"
        
        # 3. Verify competitor cards hide large illustrations on mobile
        freelance_art_display = page.evaluate(
            "() => window.getComputedStyle(document.querySelector('.ct-card.is-freelance .ct-card-artwork')).display"
        )
        assert freelance_art_display == "none", "Expected competitor artwork to be hidden on mobile"
        
        # 4. Verify hero card is prioritized and visible
        hero_card = page.locator(".ct-card.is-hero")
        assert hero_card.is_visible()
        
        # 5. Verify FAQ and Founding sections render within mobile viewport
        assert page.locator(".pr-faq-card").bounding_box()["width"] <= 350
        assert page.locator("#founding .nx-found-banner").bounding_box()["width"] <= 350
        
        assert len(errors) == 0, f"Encountered console/page errors on mobile: {errors}"
        browser.close()
