def test_register_and_login(client):
    # 1. Register
    response = client.post(
        "/api/auth/register",
        json={
            "email": "researcher_reg@papermind.ai",
            "username": "tester_reg",
            "password": "secretpassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "researcher_reg@papermind.ai"
    assert data["username"] == "tester_reg"
    assert "id" in data

    # 2. Login
    login_res = client.post(
        "/api/auth/login",
        data={
            "username": "tester_reg",
            "password": "secretpassword123"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 3. Get profile
    profile_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert profile_data["username"] == "tester_reg"
