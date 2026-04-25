"""User-products router — list / add / delete."""
from uuid import uuid4

from tests.conftest import USER_ID, make_user_product_row


def test_list_user_products_returns_array_with_joined_product(client, fake_db):
    fake_db.program([
        make_user_product_row(category_slug="shampoo"),
        make_user_product_row(category_slug="conditioner"),
    ])
    resp = client.get("/api/user-products")
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 2
    assert {r["category_slug"] for r in rows} == {"shampoo", "conditioner"}
    assert rows[0]["user_id"] == USER_ID
    assert rows[0]["product"]["name"]


def test_list_user_products_empty_returns_empty_array(client, fake_db):
    fake_db.program([])
    resp = client.get("/api/user-products")
    assert resp.status_code == 200
    assert resp.json() == []


def test_add_user_product_picker_path(client, fake_db):
    pid = str(uuid4())
    fake_db.program([
        {
            "id": str(uuid4()),
            "user_id": USER_ID,
            "product_id": pid,
            "category_slug": "moisturizer",
            "custom_name": None,
            "custom_ingredients": None,
            "product": None,
        }
    ])

    resp = client.post(
        "/api/user-products",
        json={"category_slug": "moisturizer", "product_id": pid},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["product_id"] == pid
    assert body["custom_name"] is None


def test_add_user_product_paste_path(client, fake_db):
    fake_db.program([
        {
            "id": str(uuid4()),
            "user_id": USER_ID,
            "product_id": None,
            "category_slug": "face_cleanser",
            "custom_name": "DIY cleanser",
            "custom_ingredients": "Aqua, Glycerin, Castile",
            "product": None,
        }
    ])
    resp = client.post(
        "/api/user-products",
        json={
            "category_slug": "face_cleanser",
            "custom_name": "DIY cleanser",
            "custom_ingredients": "Aqua, Glycerin, Castile",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["product_id"] is None
    assert body["custom_name"] == "DIY cleanser"


def test_delete_user_product_returns_204(client, fake_db):
    fake_db.program([])  # delete returns nothing useful
    resp = client.delete(f"/api/user-products/{uuid4()}")
    assert resp.status_code == 204


def test_user_products_require_auth(anon_client):
    assert anon_client.get("/api/user-products").status_code in (401, 403)
    assert anon_client.post("/api/user-products", json={}).status_code in (401, 403)
    assert anon_client.delete(f"/api/user-products/{uuid4()}").status_code in (401, 403)
