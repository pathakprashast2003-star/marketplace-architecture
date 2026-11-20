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
        assert "Pricing & Membership" in page.title()
        assert page.locator(".pr-title").is_visible()
        assert "Zero commission" in page.locator(".pr-title").inner_text()
        
        # 2. Check Interactive Calculator Initial State
        billings = page.locator("#calcBillingsDisplay").inner_text().strip()
        upwork_cut = page.locator("#calcUpworkCut").inner_text().strip()
        savings = page.locator("#calcNetSavings").inner_text().strip()
        assert billings == "$100,000"
        assert upwork_cut == "-$20,000"
        assert savings == "+$19,412"
        
        # 3. Test Slider Interaction
        slider = page.locator("#calcSlider")
        slider.fill("200000")
        slider.dispatch_event("input")
        page.wait_for_timeout(100)
        
        billings_new = page.locator("#calcBillingsDisplay").inner_text().strip()
        upwork_cut_new = page.locator("#calcUpworkCut").inner_text().strip()
        savings_new = page.locator("#calcNetSavings").inner_text().strip()
        assert billings_new == "$200,000"
        assert upwork_cut_new == "-$40,000"
        assert savings_new == "+$39,412"
        
        # 4. Check 3 Pricing Tier Cards
        cards = page.locator(".pr-card")
        assert cards.count() == 3
        assert page.locator(".pr-card-featured").is_visible()
        assert "Founding Member" in page.locator(".pr-card-featured").inner_text()
        
        # 5. Check Interactive FAQ
        faq_items = page.locator(".pr-faq-item")
        assert faq_items.count() >= 5
        first_faq = faq_items.first
        assert first_faq.get_attribute("open") is not None
        
        # 6. Verify Zero Console / Page Errors
        assert len(errors) == 0, f"Encountered console/page errors: {errors}"
        
        browser.close()
