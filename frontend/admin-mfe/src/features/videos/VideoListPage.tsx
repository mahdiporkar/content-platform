import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useTenant } from "../../app/tenant";
import { ContentStatus, PageResponse, Video } from "../../types";

const statusOptions: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const VideoListPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    if (!applicationId) {
      setVideos([]);
      return;
    }
    setLoading(true);
    const response = await client.get<PageResponse<Video>>("/api/v1/admin/videos", {
      params: { applicationId, status: status || undefined }
    });
    setVideos(response.data.items);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [applicationId, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Videos</h2>
          <div className="muted">Upload video assets to MinIO.</div>
        </div>
        <button className="button" onClick={() => navigate("/videos/upload")}>
          Upload Video
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
        <button className="button secondary" onClick={fetchVideos} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card">
        {videos.length === 0 && <div className="muted">No videos found for this tenant.</div>}
        {videos.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>File</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td>{video.title}</td>
                  <td>
                    <span className="badge">{video.status}</span>
                  </td>
                  <td className="muted">{video.objectKey}</td>
                  <td>{new Date(video.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
