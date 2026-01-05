import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import client from "../../api/client";
import { authStore } from "../../app/auth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await client.post("/api/v1/auth/login", { email, password });
      authStore.setToken(response.data.token);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <Card className="login-card">
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Admin Login
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Use the seeded account to enter the admin panel.
        </Typography.Paragraph>
        <Form layout="vertical" onSubmitCapture={handleSubmit}>
          <Form.Item label="Email" required>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} size="large" />
          </Form.Item>
          <Form.Item label="Password" required>
            <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} size="large" />
          </Form.Item>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
};
