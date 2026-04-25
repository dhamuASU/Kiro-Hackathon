"""Alternatives router — filter logic and skin-type fit."""
from tests.conftest import make_alternative_row


def test_returns_only_alternatives_whose_free_of_tags_cover_avoid_tags(client, fake_db):
    rows = [
        make_alternative_row(
            product_name="Sulfate-only-free",
            free_of_tags=["sulfate_free"],
        ),
        make_alternative_row(
            product_name="Both-free",
            free_of_tags=["sulfate_free", "fragrance_free"],
        ),
    ]
    fake_db.program(rows)

    resp = client.get(
        "/api/alternatives",
        params={
            "category_slug": "shampoo",
            "avoid_tags": ["sulfate_free", "fragrance_free"],
        },
    )
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) == 1
    assert matches[0]["product_name"] == "Both-free"


def test_skin_type_filter_excludes_non_matching(client, fake_db):
    rows = [
        make_alternative_row(
            product_name="For sensitive skin",
            good_for_skin_types=["sensitive"],
        ),
        make_alternative_row(
            product_name="For oily skin only",
            good_for_skin_types=["oily"],
        ),
    ]
    fake_db.program(rows)

    resp = client.get(
        "/api/alternatives",
        params={
            "category_slug": "shampoo",
            "skin_type": "sensitive",
        },
    )
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) == 1
    assert matches[0]["product_name"] == "For sensitive skin"


def test_skin_type_filter_keeps_universal_rows(client, fake_db):
    """An alternative with empty good_for_skin_types must NOT be filtered out."""
    rows = [
        make_alternative_row(
            product_name="Universal",
            good_for_skin_types=[],
        ),
    ]
    fake_db.program(rows)

    resp = client.get(
        "/api/alternatives",
        params={"category_slug": "shampoo", "skin_type": "sensitive"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_no_avoid_tags_returns_all_in_category(client, fake_db):
    rows = [
        make_alternative_row(product_name=f"Alt {i}") for i in range(3)
    ]
    fake_db.program(rows)

    resp = client.get(
        "/api/alternatives",
        params={"category_slug": "shampoo"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_results_are_capped_at_ten(client, fake_db):
    rows = [make_alternative_row(product_name=f"Alt {i}") for i in range(25)]
    fake_db.program(rows)

    resp = client.get(
        "/api/alternatives",
        params={"category_slug": "shampoo"},
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 10


def test_alternatives_requires_auth(anon_client):
    resp = anon_client.get("/api/alternatives", params={"category_slug": "shampoo"})
    assert resp.status_code in (401, 403)


def test_alternatives_requires_category_slug(client):
    resp = client.get("/api/alternatives")
    assert resp.status_code == 422
