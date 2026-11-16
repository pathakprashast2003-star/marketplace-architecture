import pytest
from playwright.sync_api import sync_playwright

def test_nexus_creators_schema():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/creator.html?slug=marcus-vance")
        creators = page.evaluate("() => window.NEXUS_CREATORS")
        assert len(creators) == 34
        for c in creators:
            assert "gear" in c and isinstance(c["gear"], list) and len(c["gear"]) >= 3
            assert "trust" in c and isinstance(c["trust"], dict)
            assert c["trust"]["rating"] >= 4.5
            assert "gallery" in c and isinstance(c["gallery"], list) and len(c["gallery"]) == 4
            for g in c["gallery"]:
                assert "src" in g and "caption" in g and "credit" in g
        browser.close()
