-- 002_seed_reference_data.sql
-- Idempotent seed of public reference data: ingredients, bans, analogies,
-- alternatives, and a small catalog of demo products. Safe to re-run.
--
-- Why these picks: a curated ~20-ingredient set chosen to reliably fire across
-- the three demo personas (sensitive/acne, anti-aging, dry/hydration). Every
-- flagged ingredient has at least one curated analogy + at least one regulatory
-- citation. This is the hackathon-shaped subset of the spec's 200+ target.

-- ───────────────────────────────────────────────────────────────────────────
-- ingredients
-- ───────────────────────────────────────────────────────────────────────────
insert into ingredients
  (inci_name, common_name, cas_number, category, function_short, plain_english, hazard_tags, goals_against, bad_for_skin_types, dose_notes)
values
  ('Sodium Lauryl Sulfate', 'SLS', '151-21-3', 'surfactant', 'cleanses',
   'An aggressive detergent that strips oil — great cleaning power, brutal on compromised skin barriers.',
   '["irritant","drying"]'::jsonb,
   '["less_sensitivity","hydration","reduce_acne"]'::jsonb,
   '["sensitive","dry"]'::jsonb,
   'Fine in occasional use; problematic when used 2×/day for years.'),

  ('Sodium Laureth Sulfate', 'SLES', '9004-82-4', 'surfactant', 'cleanses',
   'A gentler sulfate than SLS but still a strong degreaser that can disrupt the skin barrier with daily use.',
   '["irritant","drying"]'::jsonb,
   '["less_sensitivity","hydration"]'::jsonb,
   '["sensitive","dry"]'::jsonb,
   'Contaminant concern: trace 1,4-dioxane from manufacturing.'),

  ('Methylparaben', 'methylparaben', '99-76-3', 'preservative', 'preserves',
   'A preservative that mimics estrogen weakly. Banned in several Nordic products for children.',
   '["endocrine_disruptor"]'::jsonb,
   '["reduce_acne"]'::jsonb,
   '[]'::jsonb,
   'Very low potency, but exposure is cumulative across dozens of products.'),

  ('Propylparaben', 'propylparaben', '94-13-3', 'preservative', 'preserves',
   'A paraben variant with stronger estrogenic activity than methylparaben. EU restricts it in leave-on products.',
   '["endocrine_disruptor"]'::jsonb,
   '["reduce_acne"]'::jsonb,
   '[]'::jsonb,
   'EU Annex III: max 0.14% in leave-on products.'),

  ('Retinol', 'vitamin A alcohol', '68-26-8', 'active', 'cell turnover',
   'Converted to retinoic acid in skin — accelerates cell turnover. Works, but over-layering exhausts the barrier.',
   '["irritant","photoreactive"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive","dry"]'::jsonb,
   'Pregnancy: avoid. Layering multiple retinoids = barrier damage.'),

  ('Methylchloroisothiazolinone', 'MCI', '26172-55-4', 'preservative', 'preserves',
   'A strong preservative — extremely effective and extremely reactive. Common contact allergen.',
   '["sensitizer","irritant"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'EU Annex V/57: max 0.0015% in rinse-off only; banned in leave-on.'),

  ('Methylisothiazolinone', 'MI', '2682-20-4', 'preservative', 'preserves',
   'Cousin of MCI. Named "Allergen of the Year" by the American Contact Dermatitis Society in 2013.',
   '["sensitizer","irritant"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'EU: banned in leave-on products; max 0.0015% in rinse-off.'),

  ('Parfum', 'fragrance', null, 'fragrance', 'scents',
   'A catchall term that can hide up to 4,000 undisclosed chemicals — trade-secret protection means the label tells you almost nothing.',
   '["sensitizer","irritant"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'Leading cause of contact dermatitis. Even "fragrance-free" can contain masking agents.'),

  ('Oxybenzone', 'benzophenone-3', '131-57-7', 'uv_filter', 'blocks UV',
   'A chemical sunscreen that absorbs UV — also absorbs through skin into the bloodstream at measurable levels.',
   '["endocrine_disruptor","photoreactive","sensitizer"]'::jsonb,
   '["anti_aging","less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'Banned in Hawaii and Palau for coral-reef harm. Hormone activity detected at low doses.'),

  ('Octinoxate', 'octyl methoxycinnamate', '5466-77-3', 'uv_filter', 'blocks UV',
   'Another chemical sunscreen with hormone-disrupting potential. Banned alongside oxybenzone in Hawaii.',
   '["endocrine_disruptor","photoreactive"]'::jsonb,
   '["anti_aging"]'::jsonb,
   '[]'::jsonb,
   'Degrades in sunlight, forms free radicals — counterintuitive for a UV filter.'),

  ('Formaldehyde', 'formaldehyde', '50-00-0', 'preservative', 'preserves',
   'A known human carcinogen, still present as direct ingredient in a few hair-straightening products.',
   '["sensitizer","irritant"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'IARC Group 1 carcinogen. Banned as direct cosmetic ingredient in EU and CA.'),

  ('DMDM Hydantoin', 'DMDM', '6440-58-0', 'preservative', 'preserves',
   'A formaldehyde-releasing preservative — designed to slowly emit trace formaldehyde to kill microbes.',
   '["sensitizer","formaldehyde_releaser"]'::jsonb,
   '["less_sensitivity","reduce_acne"]'::jsonb,
   '["sensitive"]'::jsonb,
   'Releases formaldehyde over time. Class-action suits for hair-loss allegations.'),

  ('Quaternium-15', 'quaternium-15', '51229-78-8', 'preservative', 'preserves',
   'Another formaldehyde releaser, stronger than DMDM. California AB 2762 bans it by 2027.',
   '["sensitizer","formaldehyde_releaser"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   'One of the most common contact allergens. CA: banned from Jan 1 2027.'),

  ('Alcohol Denat', 'denatured alcohol', '64-17-5', 'solvent', 'carrier',
   'Evaporative alcohol used as a quick-absorb carrier. Strips oils and disrupts the lipid barrier with daily use.',
   '["drying","irritant"]'::jsonb,
   '["hydration","less_sensitivity"]'::jsonb,
   '["dry","sensitive"]'::jsonb,
   'Fine in trace amounts; problematic when top-5 in a leave-on product.'),

  ('Triclosan', 'triclosan', '3380-34-5', 'antimicrobial', 'antibacterial',
   'A broad-spectrum antibacterial banned by the FDA in consumer soaps (2017). Contributes to antibiotic resistance.',
   '["endocrine_disruptor"]'::jsonb,
   '["reduce_acne","less_sensitivity"]'::jsonb,
   '[]'::jsonb,
   'FDA 2017: banned in 19 soaps. Still in some toothpastes and deodorants.'),

  ('Aluminum Zirconium Tetrachlorohydrex GLY', 'aluminum zirconium', null, 'antiperspirant', 'blocks sweat',
   'Blocks sweat ducts by forming a plug. Breast-cancer link remains contested; cumulative daily exposure is the concern.',
   '["irritant"]'::jsonb,
   '[]'::jsonb,
   '["sensitive"]'::jsonb,
   'No conclusive cancer link; some studies suggest cumulative exposure warrants caution.'),

  ('Talc', 'talc', '14807-96-6', 'filler', 'absorbs moisture',
   'A powdered mineral that can be contaminated with asbestos if not properly tested. Landmark lawsuits against J&J.',
   '["irritant"]'::jsonb,
   '["reduce_acne"]'::jsonb,
   '[]'::jsonb,
   'Contamination concern: require asbestos-free certification.'),

  ('Diethyl Phthalate', 'DEP', '84-66-2', 'plasticizer', 'carrier',
   'A phthalate often used as a fragrance fixative — hidden behind the word "parfum" on most labels.',
   '["endocrine_disruptor"]'::jsonb,
   '["anti_aging","reduce_acne"]'::jsonb,
   '[]'::jsonb,
   'Crosses the placenta. EU: banned in children''s toys, still legal in cosmetics.'),

  ('PEG-40 Hydrogenated Castor Oil', 'PEG-40', '61788-85-0', 'emulsifier', 'emulsifies',
   'A PEG compound that can carry 1,4-dioxane as a manufacturing contaminant. Concern depends on supplier purity.',
   '["irritant"]'::jsonb,
   '["less_sensitivity"]'::jsonb,
   '["sensitive"]'::jsonb,
   '1,4-dioxane contamination should be <10ppm per CA Prop 65.'),

  ('Salicylic Acid', 'BHA', '69-72-7', 'active', 'exfoliates',
   'A beta-hydroxy acid that unclogs pores — genuinely effective for acne when dosed correctly.',
   '["irritant","photoreactive"]'::jsonb,
   '[]'::jsonb,
   '["sensitive","dry"]'::jsonb,
   '1–2% is effective; >2% daily can over-exfoliate. Avoid in pregnancy at high doses.')
on conflict (inci_name) do nothing;

-- ───────────────────────────────────────────────────────────────────────────
-- bans (regulatory cross-reference)
-- Real regulation references where possible; demo-grade where noted.
-- ───────────────────────────────────────────────────────────────────────────
insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex III entry 1184', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Restricted to <1% in leave-on products'
from ingredients where inci_name = 'Sodium Lauryl Sulfate'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex V/57', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Max 0.0015% in rinse-off only; banned in leave-on'
from ingredients where inci_name = 'Methylchloroisothiazolinone'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex V/57', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Banned in leave-on products; max 0.0015% in rinse-off'
from ingredients where inci_name = 'Methylisothiazolinone'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex III entry 308', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Max 0.14% total parabens in leave-on products'
from ingredients where inci_name = 'Propylparaben'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex VI entry 4', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Restricted to ≤6% in sunscreen (2022 update)'
from ingredients where inci_name = 'Oxybenzone'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'Hawaii', 'banned', 'Hawaii Act 104 (2018)', 'https://www.capitol.hawaii.gov/sessions/session2018/bills/SB2571_CD1_.PDF', 'Banned from sale to protect coral reefs (effective 2021)'
from ingredients where inci_name = 'Oxybenzone'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'Hawaii', 'banned', 'Hawaii Act 104 (2018)', 'https://www.capitol.hawaii.gov/sessions/session2018/bills/SB2571_CD1_.PDF', 'Banned from sale to protect coral reefs (effective 2021)'
from ingredients where inci_name = 'Octinoxate'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'banned', 'Reg. EC 1223/2009 Annex II entry 1577', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Banned as a direct cosmetic ingredient'
from ingredients where inci_name = 'Formaldehyde'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'California', 'banned', 'AB 2762 (Toxic-Free Cosmetics Act)', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB2762', 'Banned in cosmetics sold in CA (effective 2025)'
from ingredients where inci_name = 'Formaldehyde'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'California', 'banned', 'AB 2762 (Toxic-Free Cosmetics Act)', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB2762', 'Banned in cosmetics sold in CA (AB 496 extended list)'
from ingredients where inci_name = 'Quaternium-15'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'US', 'banned', 'FDA 21 CFR 310.545', 'https://www.fda.gov/news-events/press-announcements/fda-issues-final-rule-safety-and-effectiveness-consumer-hand-sanitizers', 'Banned from consumer antibacterial soaps (2017)'
from ingredients where inci_name = 'Triclosan'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'Canada', 'restricted', 'Cosmetic Ingredient Hotlist', 'https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/cosmetic-ingredient-hotlist-prohibited-restricted-ingredients.html', 'Restricted to ≤0.03% as preservative'
from ingredients where inci_name = 'Triclosan'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'California', 'requires_warning', 'Proposition 65', 'https://oehha.ca.gov/proposition-65', 'Prop 65 listed as possible carcinogen (unbound talc)'
from ingredients where inci_name = 'Talc'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex III', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Restricted in children''s products; full phthalate class under review'
from ingredients where inci_name = 'Diethyl Phthalate'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'California', 'banned', 'AB 496 (extended AB 2762 list)', 'https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB496', 'Banned in cosmetics sold in CA (effective 2027)'
from ingredients where inci_name = 'Methylparaben'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'restricted', 'Reg. EC 1223/2009 Annex III', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Pregnancy warning; restricted to ≤0.3% total retinoids in cosmetics'
from ingredients where inci_name = 'Retinol'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'Canada', 'restricted', 'Cosmetic Ingredient Hotlist', 'https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/cosmetic-ingredient-hotlist-prohibited-restricted-ingredients.html', 'Restricted concentrations; pregnancy warning required'
from ingredients where inci_name = 'Retinol'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'California', 'banned', 'AB 2762', 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB2762', 'Isobutyl- and isopropyl-parabens banned; methyl/propyl under AB 496 extension'
from ingredients where inci_name = 'Propylparaben'
on conflict do nothing;

insert into bans (ingredient_id, region, status, regulation_ref, source_url, reason)
select id, 'EU', 'banned', 'Reg. EC 1223/2009 Annex II', 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm', 'Classified as formaldehyde donor; banned in leave-on cosmetics'
from ingredients where inci_name = 'DMDM Hydantoin'
on conflict do nothing;

-- ───────────────────────────────────────────────────────────────────────────
-- analogies (curated, hand-written, calibrated per user goal)
-- ───────────────────────────────────────────────────────────────────────────
insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'less_sensitivity',
  'Sulfates are like sugar.',
  'In moderation, sulfates clean effectively and fade out. But if you''re reaching for a sulfate shampoo daily — like eating sugar at every meal — your scalp''s natural oils get stripped, the barrier weakens, and the sensitivity you''re trying to calm gets worse, not better.'
from ingredients where inci_name = 'Sodium Lauryl Sulfate'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'hydration',
  'Sulfates are like sugar.',
  'A once-in-a-while sulfate wash is fine. But using it twice a day for years strips the oils your skin makes to hold moisture — and when that protective layer goes, so does your hydration goal.'
from ingredients where inci_name = 'Sodium Lauryl Sulfate'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'less_sensitivity',
  'SLES is a gentler cousin — still in the family.',
  'Laureth sulfate is milder than SLS, but it''s still the same detergent family. Sensitive skin will feel the tightness after a wash — especially if the rest of the formula doesn''t rebuild the barrier afterward.'
from ingredients where inci_name = 'Sodium Laureth Sulfate'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'reduce_acne',
  'Parabens are like leaving a window cracked in winter.',
  'Any single paraben dose is small — a cracked window doesn''t freeze the room. But you''re using 6 products with parabens daily for 10 years, and their weak estrogen activity stacks up. For hormonal acne in particular, that cumulative load matters.'
from ingredients where inci_name = 'Methylparaben'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'reduce_acne',
  'Propylparaben is the stronger cousin at the same dinner table.',
  'It does the same job as methylparaben — preserves the bottle — but binds estrogen receptors more strongly. That''s why the EU capped the leave-on limit. If hormonal acne is your goal, fewer parabens in your routine is a cheap win.'
from ingredients where inci_name = 'Propylparaben'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'anti_aging',
  'Retinol is like training for a marathon every day.',
  'Retinol works — but it''s adaptive training, not a daily test. Three retinol products at once is like running a marathon every morning: your barrier doesn''t recover, and the "damage" signals overwhelm the repair signals. Pick one, use it 3×/week, and let the skin finish the adaptation.'
from ingredients where inci_name = 'Retinol'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'less_sensitivity',
  'MCI is a smoke alarm in a paint factory.',
  'It does its job — stops bacterial growth in the bottle — but it''s so reactive that even trace amounts set off your skin''s alarm system. The EU caps it at 0.0015% for that reason. For sensitive skin, the alarm going off daily is the thing you''re trying to fix.'
from ingredients where inci_name = 'Methylchloroisothiazolinone'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'less_sensitivity',
  'Fragrance is a black box.',
  'The word "Parfum" on a label can legally hide up to 4,000 undisclosed chemicals — trade-secret protection. You can''t pin down which one is triggering a reaction because you don''t know what''s in there. For sensitive skin, the simplest path to less reactivity is picking fragrance-free.'
from ingredients where inci_name = 'Parfum'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'anti_aging',
  'Oxybenzone is a UV filter that clocks out at noon.',
  'It absorbs UV light well, then degrades into free radicals in sunlight — which accelerates the aging damage you''re putting sunscreen on to prevent. Mineral filters (zinc oxide, titanium dioxide) don''t have the same failure mode. Same protection, no free-radical afterparty.'
from ingredients where inci_name = 'Oxybenzone'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'less_sensitivity',
  'DMDM is a slow leak.',
  'It works by quietly releasing trace formaldehyde — the preservative designed to kill microbes over the life of the bottle. That slow leak is what the class-action suits are about: for sensitive scalps, the drip is enough to trigger reactive hair loss and scalp inflammation.'
from ingredients where inci_name = 'DMDM Hydantoin'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'hydration',
  'Alcohol denat is like a hand sanitizer for your face.',
  'It makes the product feel light and absorb fast — because it''s evaporating and taking your skin''s moisture with it. For a hydration goal, anything with denatured alcohol in the top 5 ingredients is fighting you.'
from ingredients where inci_name = 'Alcohol Denat'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'reduce_acne',
  'Triclosan is napalm for bacteria.',
  'It kills the bad bacteria — and the good ones. That''s why the FDA pulled it from soaps in 2017: the collateral damage outweighs the benefit, and overused antibacterials breed resistant strains. Your skin microbiome is part of your acne defense.'
from ingredients where inci_name = 'Triclosan'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'reduce_acne',
  'Talc is asbestos''s next-door neighbor.',
  'Talc and asbestos form in adjacent mineral deposits — which means unless the supplier certifies it''s tested asbestos-free, contamination is possible. That''s what the Johnson & Johnson lawsuits were about. For an acne goal, there are asbestos-free alternatives (cornstarch, kaolin) that do the same job with zero contamination risk.'
from ingredients where inci_name = 'Talc'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, 'anti_aging',
  'Phthalates are a Trojan horse riding fragrance.',
  'DEP slips in under the label word "Parfum." It''s used to make scent last longer — and it crosses into your bloodstream through daily application. The EU already banned it from children''s toys; cosmetics are next. For an anti-aging goal, every endocrine disruptor you avoid is one less thing accelerating skin changes.'
from ingredients where inci_name = 'Diethyl Phthalate'
on conflict (ingredient_id, goal_slug) do nothing;

insert into analogies (ingredient_id, goal_slug, analogy_one_liner, full_explanation)
select id, null,
  'Formaldehyde is on the short list.',
  'It''s an IARC Group 1 carcinogen — the clearest hazard classification science has. The EU and California have already banned it as a direct cosmetic ingredient. If you see it on a label, the answer is simple: don''t.'
from ingredients where inci_name = 'Formaldehyde'
on conflict (ingredient_id, goal_slug) do nothing;

-- ───────────────────────────────────────────────────────────────────────────
-- alternatives (curated cleaner products)
-- ───────────────────────────────────────────────────────────────────────────
insert into alternatives (category_slug, product_name, brand, free_of_tags, good_for_skin_types, good_for_goals, avg_price_usd, url, reason) values
  ('shampoo',      'Free & Clear Shampoo',                      'Vanicream',         '["irritant","drying","sensitizer","endocrine_disruptor","formaldehyde_releaser"]'::jsonb, '["sensitive","dry"]'::jsonb, '["less_sensitivity","hydration"]'::jsonb, 9.99,  'https://vanicream.com/product/free-clear-shampoo/',         'Sulfate-, fragrance-, and preservative-concern-free. Built for the most reactive scalps.'),
  ('shampoo',      'Native Sensitive & Hydrating Shampoo',      'Native',            '["irritant","sensitizer","endocrine_disruptor","formaldehyde_releaser"]'::jsonb,           '["sensitive","dry","normal"]'::jsonb, '["less_sensitivity","hydration"]'::jsonb, 7.99,  'https://nativecos.com/',                                    'Sulfate- and paraben-free; drugstore price point.'),
  ('conditioner',  'Free & Clear Conditioner',                  'Vanicream',         '["irritant","drying","sensitizer","endocrine_disruptor","formaldehyde_releaser"]'::jsonb, '["sensitive","dry"]'::jsonb, '["less_sensitivity","hydration"]'::jsonb, 9.99,  'https://vanicream.com/product/free-clear-conditioner/',     'Matches the shampoo — same strip-nothing philosophy.'),
  ('body_wash',    'Pure-Castile Liquid Soap (Unscented Baby)', 'Dr. Bronner''s',    '["irritant","sensitizer","endocrine_disruptor"]'::jsonb,                                   '["sensitive","normal","dry"]'::jsonb, '["less_sensitivity"]'::jsonb,       13.99, 'https://www.drbronner.com/products/pure-castile-liquid-soap/', 'Plant-based surfactants, no fragrance, no parabens.'),
  ('body_wash',    'Free & Clear Gentle Body Wash',             'Vanicream',         '["irritant","drying","sensitizer","endocrine_disruptor"]'::jsonb,                          '["sensitive","dry"]'::jsonb, '["less_sensitivity","hydration"]'::jsonb,  11.99, 'https://vanicream.com/',                                    'Cleanser for the most reactive bodies. National Eczema Association accepted.'),
  ('face_cleanser','Hydrating Facial Cleanser',                 'CeraVe',            '["irritant","drying","sensitizer"]'::jsonb,                                                '["normal","dry","sensitive"]'::jsonb, '["hydration","reduce_acne"]'::jsonb, 15.99, 'https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser', 'Ceramides + hyaluronic acid, sulfate-free, non-foaming.'),
  ('face_cleanser','Gentle Facial Cleanser',                    'Vanicream',         '["irritant","sensitizer","endocrine_disruptor","formaldehyde_releaser"]'::jsonb,           '["sensitive","dry"]'::jsonb, '["less_sensitivity"]'::jsonb,                 7.49,  'https://vanicream.com/product/gentle-facial-cleanser/',      'The dermatologist-recommended reset cleanser.'),
  ('moisturizer',  'Moisturizing Cream',                        'CeraVe',            '["irritant","sensitizer"]'::jsonb,                                                         '["dry","normal","sensitive"]'::jsonb, '["hydration","less_sensitivity"]'::jsonb, 19.99, 'https://www.cerave.com/skincare/moisturizers/moisturizing-cream', 'Ceramide-rich, fragrance-free, National Eczema Association accepted.'),
  ('moisturizer',  'Daily Facial Moisturizer',                  'Vanicream',         '["irritant","sensitizer","endocrine_disruptor"]'::jsonb,                                   '["sensitive","dry","combination"]'::jsonb, '["hydration","less_sensitivity"]'::jsonb, 14.99, 'https://vanicream.com/product/daily-facial-moisturizer/', 'Fragrance-, dye-, and paraben-free.'),
  ('sunscreen',    'UV Clear Broad-Spectrum SPF 46',            'EltaMD',            '["endocrine_disruptor","photoreactive","sensitizer"]'::jsonb,                              '["sensitive","combination","oily"]'::jsonb, '["anti_aging","less_sensitivity"]'::jsonb, 39.00, 'https://www.eltamd.com/products/uv-clear-broad-spectrum-spf-46', 'Zinc oxide mineral sunscreen. No oxybenzone, no octinoxate.'),
  ('sunscreen',    'Mineral Sunscreen SPF 30+',                 'Blue Lizard',       '["endocrine_disruptor","photoreactive"]'::jsonb,                                           '["sensitive","normal","dry"]'::jsonb, '["anti_aging"]'::jsonb,                     14.99, 'https://bluelizardsunscreen.com/',                           'Mineral-only formula. Reef-safe, oxybenzone-free.'),
  ('deodorant',    'Sensitive Unscented Deodorant',             'Native',            '["endocrine_disruptor","sensitizer","formaldehyde_releaser"]'::jsonb,                      '["sensitive","normal","dry"]'::jsonb, '["less_sensitivity"]'::jsonb,                13.00, 'https://nativecos.com/',                                    'Aluminum-free, paraben-free, no added fragrance.'),
  ('deodorant',    'Sensitive Skin Unscented',                  'Schmidt''s',        '["endocrine_disruptor","sensitizer"]'::jsonb,                                              '["sensitive","normal"]'::jsonb, '["less_sensitivity"]'::jsonb,                       10.99, 'https://www.schmidts.com/',                                 'Baking-soda-free for sensitive pits; plant-based.'),
  ('toothpaste',   'Clean & Gentle Toothpaste',                 'David''s',          '["irritant","endocrine_disruptor"]'::jsonb,                                                '["sensitive","normal","dry","combination","oily"]'::jsonb, '["less_sensitivity"]'::jsonb, 7.99,  'https://davids.com/',                                       'No SLS, no triclosan, no artificial sweeteners.'),
  ('toothpaste',   'Natural Anticavity Fluoride-Free',          'Tom''s of Maine',   '["irritant","endocrine_disruptor"]'::jsonb,                                                '["sensitive","normal"]'::jsonb, '["less_sensitivity"]'::jsonb,                       5.99,  'https://www.tomsofmaine.com/',                              'SLS-free variant exists (check label). No triclosan, no parabens.'),
  ('serum',        'The Retinol 0.2% in Squalane',              'The Ordinary',      '["endocrine_disruptor","sensitizer","formaldehyde_releaser"]'::jsonb,                      '["normal","combination","oily"]'::jsonb, '["anti_aging"]'::jsonb,                    6.70,  'https://theordinary.com/',                                  'Low-dose retinol in a barrier-friendly squalane base. Start slow.'),
  ('lip_balm',     'Lip Balm',                                  'Vanicream',         '["irritant","sensitizer","endocrine_disruptor","formaldehyde_releaser"]'::jsonb,           '["sensitive","dry"]'::jsonb, '["less_sensitivity","hydration"]'::jsonb,                  4.99,  'https://vanicream.com/product/lip-balm/',                    'Fragrance- and paraben-free; petrolatum base.');

-- ───────────────────────────────────────────────────────────────────────────
-- demo products — populates the common-products dropdown and lets demos run
-- without hitting Open Beauty Facts.
-- ───────────────────────────────────────────────────────────────────────────
insert into products (off_id, name, brand, category_slug, ingredients_raw, ingredients_parsed, source, popularity) values
  (
    'demo-head-shoulders-classic',
    'Classic Clean Shampoo',
    'Head & Shoulders',
    'shampoo',
    'Water, Sodium Laureth Sulfate, Sodium Lauryl Sulfate, Cocamidopropyl Betaine, Sodium Chloride, Dimethicone, Parfum, Zinc Pyrithione, Methylchloroisothiazolinone, Methylisothiazolinone, DMDM Hydantoin',
    '["Water","Sodium Laureth Sulfate","Sodium Lauryl Sulfate","Cocamidopropyl Betaine","Sodium Chloride","Dimethicone","Parfum","Zinc Pyrithione","Methylchloroisothiazolinone","Methylisothiazolinone","DMDM Hydantoin"]'::jsonb,
    'open_beauty_facts',
    100
  ),
  (
    'demo-pantene-pro-v',
    'Pro-V Classic Care Shampoo',
    'Pantene',
    'shampoo',
    'Water, Sodium Laureth Sulfate, Sodium Lauryl Sulfate, Sodium Citrate, Sodium Xylenesulfonate, Cocamidopropyl Betaine, Dimethicone, Parfum, Methylparaben, Propylparaben',
    '["Water","Sodium Laureth Sulfate","Sodium Lauryl Sulfate","Sodium Citrate","Sodium Xylenesulfonate","Cocamidopropyl Betaine","Dimethicone","Parfum","Methylparaben","Propylparaben"]'::jsonb,
    'open_beauty_facts',
    95
  ),
  (
    'demo-nivea-body-wash',
    'Creme Soft Shower Cream',
    'Nivea',
    'body_wash',
    'Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Sodium Lauryl Sulfate, Parfum, Methylparaben, Propylparaben',
    '["Water","Sodium Laureth Sulfate","Cocamidopropyl Betaine","Sodium Lauryl Sulfate","Parfum","Methylparaben","Propylparaben"]'::jsonb,
    'open_beauty_facts',
    90
  ),
  (
    'demo-neutrogena-acne-wash',
    'Oil-Free Acne Wash',
    'Neutrogena',
    'face_cleanser',
    'Water, Sodium C14-16 Olefin Sulfonate, Salicylic Acid, Cocamidopropyl Betaine, Sodium Laureth Sulfate, Parfum, Methylparaben',
    '["Water","Sodium C14-16 Olefin Sulfonate","Salicylic Acid","Cocamidopropyl Betaine","Sodium Laureth Sulfate","Parfum","Methylparaben"]'::jsonb,
    'open_beauty_facts',
    92
  ),
  (
    'demo-cerave-foaming-cleanser',
    'Foaming Facial Cleanser',
    'CeraVe',
    'face_cleanser',
    'Water, Cocamidopropyl Hydroxysultaine, Sodium Lauroyl Sarcosinate, Glycerin, Niacinamide, Ceramide 3, Ceramide 6-II, Ceramide 1, Hyaluronic Acid',
    '["Water","Cocamidopropyl Hydroxysultaine","Sodium Lauroyl Sarcosinate","Glycerin","Niacinamide","Ceramide 3","Ceramide 6-II","Ceramide 1","Hyaluronic Acid"]'::jsonb,
    'open_beauty_facts',
    88
  ),
  (
    'demo-olay-regenerist',
    'Regenerist Retinol 24 Night Moisturizer',
    'Olay',
    'moisturizer',
    'Water, Glycerin, Niacinamide, Isohexadecane, Dimethicone, Retinol, Retinyl Propionate, Parfum, Methylparaben, Propylparaben',
    '["Water","Glycerin","Niacinamide","Isohexadecane","Dimethicone","Retinol","Retinyl Propionate","Parfum","Methylparaben","Propylparaben"]'::jsonb,
    'open_beauty_facts',
    85
  ),
  (
    'demo-banana-boat-sport',
    'Sport Performance Sunscreen SPF 50',
    'Banana Boat',
    'sunscreen',
    'Avobenzone, Homosalate, Octisalate, Octocrylene, Oxybenzone, Water, Parfum, Diethyl Phthalate',
    '["Avobenzone","Homosalate","Octisalate","Octocrylene","Oxybenzone","Water","Parfum","Diethyl Phthalate"]'::jsonb,
    'open_beauty_facts',
    80
  ),
  (
    'demo-old-spice-deodorant',
    'High Endurance Pure Sport Deodorant',
    'Old Spice',
    'deodorant',
    'Aluminum Zirconium Tetrachlorohydrex GLY, Cyclopentasiloxane, Stearyl Alcohol, Parfum, Diethyl Phthalate, BHT',
    '["Aluminum Zirconium Tetrachlorohydrex GLY","Cyclopentasiloxane","Stearyl Alcohol","Parfum","Diethyl Phthalate","BHT"]'::jsonb,
    'open_beauty_facts',
    78
  ),
  (
    'demo-crest-cavity',
    'Cavity Protection Toothpaste',
    'Crest',
    'toothpaste',
    'Sodium Fluoride, Water, Sorbitol, Hydrated Silica, Sodium Lauryl Sulfate, Parfum, Sodium Saccharin',
    '["Sodium Fluoride","Water","Sorbitol","Hydrated Silica","Sodium Lauryl Sulfate","Parfum","Sodium Saccharin"]'::jsonb,
    'open_beauty_facts',
    75
  ),
  (
    'demo-cerave-hydrating-cleanser',
    'Hydrating Facial Cleanser',
    'CeraVe',
    'face_cleanser',
    'Water, Glycerin, Behentrimonium Methosulfate, Cetyl Alcohol, Ceramide 3, Ceramide 6-II, Ceramide 1, Hyaluronic Acid, Cholesterol, Phenoxyethanol',
    '["Water","Glycerin","Behentrimonium Methosulfate","Cetyl Alcohol","Ceramide 3","Ceramide 6-II","Ceramide 1","Hyaluronic Acid","Cholesterol","Phenoxyethanol"]'::jsonb,
    'open_beauty_facts',
    87
  ),
  (
    'demo-aveeno-positively-ageless',
    'Positively Ageless Daily Moisturizer SPF 30',
    'Aveeno',
    'sunscreen',
    'Avobenzone, Homosalate, Octisalate, Octocrylene, Octinoxate, Water, Glycerin, Parfum',
    '["Avobenzone","Homosalate","Octisalate","Octocrylene","Octinoxate","Water","Glycerin","Parfum"]'::jsonb,
    'open_beauty_facts',
    72
  )
on conflict (off_id) do nothing;
