import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { Application } from "../../types";

export const ApplicationsListPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    const response = await client.get<Application[]>("/api/v1/admin/applications");
    setApplications(response.data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this application?");
    if (!confirmDelete) {
      return;
    }
    await client.delete(`/api/v1/admin/applications/${id}`);
    await fetchApplications();
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Applications</h2>
          <div className="muted">Manage tenant identifiers for content.</div>
        </div>
        <button className="button" onClick={() => navigate("/applications/new")}>
          New Application
        </button>
      </div>

      <div className="toolbar">
        <button className="button secondary" onClick={fetchApplications} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="card">
        {applications.length === 0 && <div className="muted">No applications found.</div>}
        {applications.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Website</th>
                <th>ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.name}</td>
                  <td>{application.websiteUrl || <span className="muted">-</span>}</td>
                  <td>
                    <code>{application.id}</code>
                  </td>
                  <td>
                    <button
                      className="button secondary"
                      onClick={() =>
                        navigate(`/applications/${application.id}`, { state: { application } })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => handleDelete(application.id)}
                    >
                      Delete
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
