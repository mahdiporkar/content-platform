import React, { useRef, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Space } from 'antd';
import { uploadMedia } from '../../api/media';
import { MediaPickerModal } from '../../components/MediaPickerModal';

export type VideoMediaValue = {
  posterKey?: string | null;
  durationSeconds?: number | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export function VideoMediaFields({ applicationId, value, onChange }: {
  applicationId: string;
  value: VideoMediaValue;
  onChange: (value: VideoMediaValue) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <Card size="small" title="پوستر و مشخصات ویدیو / Video poster" style={{ marginBottom: 16 }}>
    <Alert type="info" showIcon message="برای انتشار، پوستر و توضیحات ویدیو را وارد کنید. برای نمایش در ویدیوهای آموزشی، ویدیو را به مجموعهٔ آموزشی سایت اضافه کنید." style={{ marginBottom: 16 }} />
    {error && <Alert type="error" message={error} />}
    <Form.Item label="پوستر ویدیو / Poster" required>
      <Space wrap>
        <Button loading={busy} onClick={() => input.current?.click()}>بارگذاری پوستر / Upload poster</Button>
        <Button onClick={() => setPicker(true)}>انتخاب از فایل‌ها / Choose image</Button>
        {value.posterKey && <Button onClick={() => onChange({ ...value, posterKey: null })}>حذف پوستر / Remove</Button>}
      </Space>
      {value.posterKey && <div style={{ overflowWrap: 'anywhere', marginTop: 8 }}>{value.posterKey}</div>}
      <input ref={input} hidden type="file" accept="image/*" onChange={async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        setBusy(true); setError('');
        try {
          const result = await uploadMedia(file, applicationId, 'image');
          onChange({ ...value, posterKey: result.objectKey });
        } catch { setError('بارگذاری پوستر ناموفق بود / Poster upload failed.'); }
        finally { setBusy(false); event.target.value = ''; }
      }} />
    </Form.Item>
    <Form.Item label="توضیح تصویر / Poster alt text">
      <Input value={value.altText ?? ''} onChange={e => onChange({ ...value, altText: e.target.value })} />
    </Form.Item>
    <Form.Item label="مدت ویدیو به ثانیه / Duration in seconds">
      <InputNumber min={1} precision={0} value={value.durationSeconds} onChange={durationSeconds => onChange({ ...value, durationSeconds })} />
    </Form.Item>
    <MediaPickerModal open={picker} applicationId={applicationId} allowedKinds={['image']}
      onCancel={() => setPicker(false)} onSelect={asset => {
        onChange({ ...value, posterKey: asset.objectKey }); setPicker(false);
      }} />
  </Card>;
}
