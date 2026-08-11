from app.models.service import Service

def test_get_empty_services(client):
    """Test getting services when DB is empty."""
    response = client.get("/api/v1/services/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_services(client, db_session):
    """Test getting services with mock data."""
    # 1. Insert mock data into the test database
    mock_service = Service(
        name="Silk Press",
        slug="silk-press",
        duration_minutes=120,
        price_cents=8500,
        is_active=True
    )
    db_session.add(mock_service)
    db_session.commit()

    # 2. Make the API request
    response = client.get("/api/v1/services/")
    
    # 3. Assert the results
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Silk Press"
    assert data[0]["price_cents"] == 8500

def test_get_service_not_found(client):
    """Test getting a non-existent service."""
    response = client.get("/api/v1/services/does-not-exist")
    assert response.status_code == 404