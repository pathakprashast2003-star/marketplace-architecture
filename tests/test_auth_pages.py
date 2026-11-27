import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"


def test_login_page_renders_and_functions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        response = page.goto(f"{BASE_URL}/login")
        assert response.status == 200, f"Expected 200 OK for /login, got {response.status}"

        # Brand header
        brand = page.locator(".nx-auth-brand")
        assert brand.is_visible()
        assert "nexus." in brand.inner_text().lower()

        # Sign up link
        signup_link = page.locator(".nx-auth-nav a:has-text('Sign up')")
        assert signup_link.is_visible()

        # Google button
        google_btn = page.locator(".btn-google")
        assert google_btn.is_visible()
        assert "Continue with Google" in google_btn.inner_text()

        # Email input & Send OTP button
        email_input = page.locator("#loginEmail")
        send_btn = page.locator("#loginSendCodeBtn")
        assert email_input.is_visible()
        assert send_btn.is_visible()
        assert "Send me a code" in send_btn.inner_text()

        # Test invalid email validation
        email_input.fill("not-an-email")
        send_btn.click()
        msg = page.locator("#msgLoginStart")
        assert "valid email" in msg.inner_text().lower()

        # Test valid email submission advances to step 2 (OTP code)
        email_input.fill("testuser@agency.com")
        send_btn.click()

        # Wait for step 2
        step2 = page.locator("#stepLoginCode")
        step2.wait_for(state="visible")
        assert "Check your email" in page.locator("#h1LoginCode").inner_text()
        assert "testuser@agency.com" in page.locator("#loginSentTo").inner_text()

        # 6 OTP input boxes should be present
        otp_boxes = page.locator("#loginCodeInputs input")
        assert otp_boxes.count() == 6

        for i in range(6):
            otp_boxes.nth(i).fill(str(i + 1))

        critical_errors = [e for e in console_errors if "favicon" not in e.lower() and "turnstile" not in e.lower()]
        assert len(critical_errors) == 0, f"Unexpected console errors: {critical_errors}"

        browser.close()


def test_signup_landing_page_structure_and_two_choices():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        response = page.goto(f"{BASE_URL}/signup")
        assert response.status == 200, f"Expected 200 OK for /signup, got {response.status}"

        # Matches landing page #join header & tabs
        assert "Find your creative" in page.locator("#jnT").inner_text()
        assert page.locator("#tabClient").is_visible()
        assert page.locator("#tabCreator").is_visible()
        assert page.locator("#tabLogin").is_visible()

        # Sliding grid defaults to client ("hire") with blue Creator panel on the right
        sw = page.locator("#jnSw")
        assert sw.get_attribute("data-side") == "hire"
        assert page.locator("#viewClient").is_visible()
        assert page.locator("#btnChooseCreator").is_visible()
        assert "creator / business" in page.locator("#btnChooseCreator").inner_text().lower()

        # Link to login page
        assert page.locator("#topNavLoginLink").is_visible()

        critical_errors = [e for e in console_errors if "favicon" not in e.lower() and "turnstile" not in e.lower()]
        assert len(critical_errors) == 0, f"Unexpected console errors: {critical_errors}"

        browser.close()


def test_signup_client_flow_magic_link():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        page.goto(f"{BASE_URL}/signup")

        # Client view is active on left
        assert page.locator("#viewClient").is_visible()
        assert "Find & hire talent" in page.locator("#clientTitle").inner_text()

        # Google button and email input
        google_btn = page.locator("#clientGoogleBtn")
        assert google_btn.is_visible()
        assert "Continue with Google" in google_btn.inner_text()

        email_input = page.locator("#clientEmail")
        send_btn = page.locator("#clientSendBtn")
        assert email_input.is_visible()
        assert "Send magic link" in send_btn.inner_text()

        # Invalid email validation
        email_input.fill("bad-email")
        send_btn.click()
        assert "valid email" in page.locator("#clientMsg").inner_text().lower()

        # Valid email -> Magic link sent
        email_input.fill("producer@studio.com")
        send_btn.click()

        sent_stage = page.locator("#clientSentStage")
        sent_stage.wait_for(state="visible")
        assert "Magic link sent" in page.locator("#clientSentStage h2").inner_text()
        assert "producer@studio.com" in page.locator("#clientSentEmail").inner_text()

        browser.close()


def test_signup_creator_flow_to_page10():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        page.goto(f"{BASE_URL}/signup")

        # Switch to creator via blue panel CTA ("I'm a creator / business →")
        page.locator("#btnChooseCreator").click()
        assert page.locator("#jnSw").get_attribute("data-side") == "be"

        # Wait for sliding transition
        page.wait_for_timeout(650)

        view_creator = page.locator("#viewCreator")
        assert view_creator.is_visible()
        assert "Claim your founding spot" in page.locator("#creatorTitle").inner_text()
        assert "founding spots" in page.locator(".jn-count").inner_text().lower()

        # Google button & Email field
        assert page.locator("#creatorGoogleBtn").is_visible()
        email_input = page.locator("#creatorEmail")
        send_btn = page.locator("#creatorSendCodeBtn")
        assert "Email me a 6-digit code" in send_btn.inner_text()

        # Submit email
        email_input.fill("director@visuals.co")
        send_btn.click()

        # Step 2: 6-digit code input
        step2 = page.locator("#creatorStep2")
        step2.wait_for(state="visible")
        assert "Enter your 6-digit code" in step2.inner_text()
        assert "director@visuals.co" in page.locator("#creatorSentEmail").inner_text()

        otp_boxes = page.locator("#creatorOtpGrid input")
        assert otp_boxes.count() == 6
        for i in range(6):
            otp_boxes.nth(i).fill(str(i + 1))

        # Step 3: Identity & Age Gate
        step3 = page.locator("#creatorStep3")
        step3.wait_for(state="visible")
        assert "A bit about you" in step3.inner_text()

        page.locator("#creatorName").fill("Marcus Vance")
        page.locator("#dobMonth").select_option("05")
        page.locator("#dobDay").select_option("15")
        page.locator("#dobYear").select_option("1998")
        page.locator("#creatorSaveAboutBtn").click()

        # Step 4: Completion -> Page 10
        step_done = page.locator("#creatorStepDone")
        step_done.wait_for(state="visible")
        assert "You're in! Welcome to Nexus" in step_done.inner_text()

        onboarding_link = page.locator("#creatorOnboardingLink")
        assert onboarding_link.is_visible()
        assert "/seller/onboarding" in onboarding_link.get_attribute("href")
        assert "Page 10" in onboarding_link.inner_text()

        onboarding_link.click()
        page.wait_for_url("**/seller/onboarding**")
        assert "Build your verified storefront" in page.locator("h1").inner_text()

        browser.close()


def test_signup_direct_intent_urls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        page.goto(f"{BASE_URL}/signup?intent=client")
        assert page.locator("#jnSw").get_attribute("data-side") == "hire"

        page.goto(f"{BASE_URL}/signup?intent=creator")
        assert page.locator("#jnSw").get_attribute("data-side") == "be"

        page.goto(f"{BASE_URL}/signup?intent=login")
        assert page.locator("#jnSw").get_attribute("data-login") == "open"

        browser.close()
