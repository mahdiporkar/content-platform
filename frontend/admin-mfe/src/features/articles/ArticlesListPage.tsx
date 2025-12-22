import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { Article, ContentStatus, PageResponse } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const ArticlesListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArticles = async () => {
    if (!applicationId) {
      setArticles([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Article>>("/api/v1/admin/articles", {
      params: { applicationId, status: status || undefined }
    });
    setArticles(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, [applicationId, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Articles</h2>
          <div className="muted">Long-form narratives and deep dives.</div>
        </div>
        <button className="button" onClick={() => navigate("/articles/new")}>
          New Article
        </button>
      </div>

      <div className="toolbar">
        <div className="input">
          <label>Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus | "")}>
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button className="button secondary" onClick={fetchArticles} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card">
        {articles.length === 0 && <div className="muted">No articles found for this tenant.</div>}
        {articles.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{article.slug}</td>
                  <td>
                    <span className="badge">{article.status}</span>
                  </td>
                  <td>{new Date(article.updatedAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => navigate(`/articles/${article.id}`, { state: { article } })}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
