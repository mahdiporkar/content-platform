import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, PageResponse, Post } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const PostsListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    if (!applicationId) {
      setPosts([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Post>>("/api/v1/admin/posts", {
      params: { applicationId, status: status || undefined }
    });
    setPosts(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [applicationId, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Posts</h2>
          <div className="muted">Short-form content across tenants.</div>
        </div>
        <button className="button" onClick={() => navigate("/posts/new")}>
          New Post
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
        <button className="button secondary" onClick={fetchPosts} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card">
        {posts.length === 0 && <div className="muted">No posts found for this tenant.</div>}
        {posts.length > 0 && (
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
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.slug}</td>
                  <td>
                    <span className="badge">{post.status}</span>
                  </td>
                  <td>{new Date(post.updatedAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => navigate(`/posts/${post.id}`, { state: { post } })}
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
