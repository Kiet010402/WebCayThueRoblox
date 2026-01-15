import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './AnnouncementEditor.css';

export default function AnnouncementEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Thông Báo | Trang Chủ');
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/announcement', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTitle(res.data?.title || 'Thông Báo | Trang Chủ');
      setContent(res.data?.content || '');
    };

    setLoading(true);
    fetchAnnouncement()
      .catch((err) => {
        console.error('Error fetching announcement:', err);
        alert(err.response?.data?.message || 'Không thể tải thông báo');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      setSaving(true);
      await api.put(
        '/api/admin/announcement',
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Cập nhật thông báo thành công!');
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert(err.response?.data?.message || 'Cập nhật thông báo thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="announcement-editor">
      <div className="announcement-title">
        <span className="announcement-title-bar" />
        <span>{title || 'Thông Báo | Trang Chủ'}</span>
      </div>

      <div className="announcement-card">
        {loading ? (
          <div className="announcement-loading">Đang tải thông báo...</div>
        ) : (
          <>
            <div className="announcement-controls">
              <label className="announcement-label">Tiêu đề</label>
              <input
                className="announcement-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thông Báo | Trang Chủ"
              />
            </div>

            <div className="announcement-controls">
              <label className="announcement-label">Nội dung (HTML)</label>
              <textarea
                className="announcement-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung HTML..."
              />
              <div className="announcement-hint">
                Bạn có thể dán HTML (ví dụ: &lt;b&gt;in đậm&lt;/b&gt;, &lt;a href=&quot;...&quot;&gt;link&lt;/a&gt;).
              </div>
            </div>

            <div className="announcement-actions">
              <button className="announcement-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang cập nhật...' : 'Cập nhật ngay'}
              </button>
            </div>

            <div className="announcement-preview">
              <div className="announcement-preview-title">Xem trước</div>
              <div
                className="announcement-preview-body"
                dangerouslySetInnerHTML={{ __html: content || '<i>(trống)</i>' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}


