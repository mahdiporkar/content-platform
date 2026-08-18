import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input, Select, Typography } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  PictureOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import client from "../../api/client";
import { authStore } from "../../app/auth";
import { type SupportedLocale, useI18n } from "../../i18n";
import { demoModeEnabled } from "../../config/env";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { locale, direction, setLocale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoWorkspace, setDemoWorkspace] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await client.post("/api/v1/auth/login", { email, password });
      authStore.setToken(response.data.token);
      navigate("/");
    } catch (err) {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStart = async () => {
    if (demoWorkspace.trim().length < 2) return;
    setDemoLoading(true);
    setError(null);
    try {
      const response = await client.post("/api/v1/demo/sessions", {
        workspaceName: demoWorkspace.trim(),
        locale
      });
      authStore.setToken(response.data.token);
      localStorage.setItem("content-platform-application-id", response.data.applicationId);
      localStorage.setItem("content-platform-demo-application-token", response.data.applicationToken);
      localStorage.setItem("content-platform-demo-expires-at", response.data.expiresAt);
      navigate("/posts");
    } catch {
      setError("Unable to create a demo workspace. Please try again later.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="login-shell" dir={direction}>
      <div className="login-orb login-orb--one" />
      <div className="login-orb login-orb--two" />

      <main className="login-panel">
        <section className="login-showcase">
          <div className="login-brand">
            <span className="login-brand__mark">
              <AppstoreOutlined />
            </span>
            <div>
              <strong>{t("app.brand")}</strong>
              <span>{t("app.console")}</span>
            </div>
          </div>

          <div className="login-showcase__content">
            <span className="login-kicker">{t("login.eyebrow")}</span>
            <Typography.Title className="login-showcase__title">
              {t("login.feature.content")}
            </Typography.Title>
            <div className="login-features">
              {[t("login.feature.teams"), t("login.feature.delivery")].map((feature) => (
                <div className="login-feature" key={feature}>
                  <CheckCircleFilled />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="login-dashboard-preview" aria-hidden="true">
              <div className="login-preview__header">
                <span>{t("login.preview.title")}</span>
                <span className="login-preview__status">{t("login.preview.live")}</span>
              </div>
              <div className="login-preview__grid">
                <div className="login-preview__card">
                  <FileTextOutlined />
                  <span>{t("menu.posts")}</span>
                  <strong>۱۲۸</strong>
                </div>
                <div className="login-preview__card">
                  <PictureOutlined />
                  <span>{t("menu.media")}</span>
                  <strong>۲.۴K</strong>
                </div>
                <div className="login-preview__card login-preview__card--chart">
                  <BarChartOutlined />
                  <span>{t("menu.analytics")}</span>
                  <div className="login-preview__bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="login-showcase__footer">
            <SafetyCertificateOutlined />
            <span>{t("login.secure")}</span>
          </div>
        </section>

        <section className="login-form-side">
          <div className="login-language">
            <GlobalOutlined />
            <Select
              variant="borderless"
              value={locale}
              onChange={(value) => setLocale(value as SupportedLocale)}
              popupMatchSelectWidth={false}
              aria-label={t("app.language")}
              options={[
                { value: "fa", label: "فارسی" },
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
                { value: "zh", label: "中文" },
                { value: "ru", label: "Русский" }
              ]}
            />
          </div>

          <div className="login-form-wrap">
            <div className="login-form-heading">
              <span className="login-mobile-mark">
                <AppstoreOutlined />
              </span>
              <span className="login-form-eyebrow">{t("login.secure")}</span>
              <Typography.Title level={2}>{t("login.title")}</Typography.Title>
              <Typography.Paragraph>{t("login.subtitle")}</Typography.Paragraph>
            </div>

            <Form className="login-form" layout="vertical" onSubmitCapture={handleSubmit}>
              <Form.Item label={t("login.email")} required>
                <Input
                  prefix={<MailOutlined />}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  size="large"
                  autoComplete="username"
                  autoFocus
                  dir="ltr"
                />
              </Form.Item>
              <Form.Item label={t("login.password")} required>
                <Input.Password
                  prefix={<LockOutlined />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  size="large"
                  autoComplete="current-password"
                  dir="ltr"
                />
              </Form.Item>
              {error && <Alert type="error" message={error} showIcon className="login-alert" />}
              <Button className="login-submit" type="primary" htmlType="submit" loading={loading} block size="large">
                {loading ? t("login.loading") : t("login.submit")}
              </Button>
            </Form>

            {demoModeEnabled && <div className="demo-login">
              <div className="demo-login__divider"><span>OR TRY THE LIVE DEMO</span></div>
              <Alert type="info" showIcon message="Create an isolated workspace" description="Test posts, articles, media, collections, SEO and analytics. The workspace expires automatically." />
              <Input
                value={demoWorkspace}
                onChange={(event) => setDemoWorkspace(event.target.value)}
                placeholder="Your application name"
                size="large"
                maxLength={60}
              />
              <Button type="default" size="large" block loading={demoLoading} disabled={demoWorkspace.trim().length < 2} onClick={handleDemoStart}>
                Create workspace & enter demo
              </Button>
            </div>}

            <span className="login-copyright">{t("login.footer")}</span>
          </div>
        </section>
      </main>
    </div>
  );
};
