from app.models.paper import Paper

def test_list_and_update_papers(client, db_session, auth_user):
    user = auth_user["user"]
    headers = auth_user["headers"]

    paper = Paper(
        user_id=user.id,
        title="Attention Is All You Need",
        authors="Vaswani et al.",
        year=2017,
        abstract="The dominant sequence transduction models...",
        filename="test.pdf",
        file_path="/tmp/test.pdf",
        status="ready"
    )
    db_session.add(paper)
    db_session.commit()
    db_session.refresh(paper)
    paper_id = paper.id

    # List papers
    res = client.get("/api/papers", headers=headers)
    assert res.status_code == 200
    papers_list = res.json()
    assert len(papers_list) >= 1

    # Update paper
    update_res = client.put(
        f"/api/papers/{paper_id}",
        json={"title": "Attention Is All You Need (Updated)"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Attention Is All You Need (Updated)"
