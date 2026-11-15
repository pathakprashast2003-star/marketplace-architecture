# Reverse-engineering findings (captured 6 Nov 2026)

Captured in the Claude app browser from India. Public pages only, no data kept beyond these notes.

## Thumbtack
Blocked from India ("request is coming from a country which we currently do not support"). The Knot's search pattern stands in.

## The Knot: results page (/marketplace/wedding-photographers-austin-tx)
- URL pattern: /marketplace/<category>-<city>-<state>
- H1: "459 results for Wedding Photographers near Austin, TX"; 16 pages of results
- Card: name, rating + review count, short pitch, "Starting at $X", badges (Award winner, Responds quickly, Recently updated), Save, View Vendor Storefront, Request pricing
- Bottom: "Explore other photographers in Austin" style links, "Wedding vendors in Austin" category links, FAQ block, breadcrumb
- Decision: copy card fields (no reviews), "Starting at" price, two buttons, city+category URL, FAQ + internal links for SEO

## The Knot: filters (one drawer, "See results (459)")
Category; Deals; Award winners; Support diversity (Black-, woman-, veteran-, LGBTQ+-owned etc.); Distance (5/10/25/50/100 mi); Styles; Shoot types; Starting price min/max; Wedding events; Options (digital files, drone, film, online proofing, prints, same-day edits); Outdoor space
- Decision v1: category, city + distance, starting price min/max, 3-5 craft options. Owner-identity tags = optional idea for Tyrone.

## The Knot: storefront
Sections: About this vendor, Prices & packages, Review summary, Service area & contact info, Wedding vendors in <city>
- Decision: About, Services & prices, Portfolio, Service area. No reviews in v1.

## The Knot: inquiry form ("Message Vendor" / "Start the convo")
Fields: first name*, last name*, email*, wedding date* (+ "date is flexible"), number of guests*, phone (optional), message* ("ask about style, budget or availability")
Shows: vendor name, contact person + role, "Typically responds within 24h". Sending accepts terms and creates an account.
- Decision: name, email, project date + flexible, budget range, phone optional, message; show creator response time; send creates/signs in client account.

## The Knot: vendor sign-up
Not reachable from this browser. Use Tyrone's brief (application, admin approval, trial).

## Contra: profile (/<handle>)
Header: name, PRO badge, headline, Message, Follow, stats ($ earned, times hired, rating, followers), expertise tag, country
Tabs: Work, Posts, Products, Reviews, Services, About. Work = grid of project tiles.
- Decision: avatar, name, Founding badge, headline, city, Message + Save; tabs Work, Services, About.

## Contra: services
Card: title, tools, price ("$1,200") or "Contact for pricing"
- Decision: title, short description, price or "Contact for pricing".

## Airbnb: filters + favorites
Filters dialog: recommended chips, type of place, price range min/max (all fees included), rooms, amenities, neighbourhoods, booking options; "Clear all" + live count button ("Show 1,000+ places"). Heart = "Add to wishlist".
- Decision: one filter drawer with Clear all + live result count; heart labelled "Save".

## Biggest takeaway
The Knot already runs Tyrone's exact model. Follow its results card, storefront order and structured inquiry, restyled in Dunes, without reviews.
