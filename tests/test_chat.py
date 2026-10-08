from app.models.paper import Paper

def test_chat_session_and_message(client, db_session, auth_user):
    user = auth_user["user"]
    headers = auth_user["headers"]

    paper = Paper(
        user_id=user.id,
        title="ResNet Deep Residual Learning",
        authors="He et al.",
        year=2015,
        filename="resnet.pdf",
        file_path="/tmp/resnet.pdf",
        status="ready"
    )
    db_session.add(paper)
    db_session.commit()
    db_session.refresh(paper)

    # 1. Create chat session
    res = client.post(
        "/api/chat/sessions",
        json={"paper_id": paper.id, "title": "Understanding Residuals"},
        headers=headers
    )
    assert res.status_code == 201
    session_data = res.json()
    session_id = session_data["id"]

    # 2. Post a chat message
    msg_res = client.post(
        f"/api/chat/sessions/{session_id}/messages",
        json={"query": "What problem do residual connections solve?", "agent_mode": "research"},
        headers=headers
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["role"] == "assistant"
    assert len(msg_data["content"]) > 10

    # 3. Fetch conversation history
    history_res = client.get(
        f"/api/chat/sessions/{session_id}",
        headers=headers
    )
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert len(history_data["messages"]) == 2  # 1 user + 1 assistant
