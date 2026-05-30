import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Send, Loader, User, MessageSquare, ThumbsUp, Heart, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface Props { onBack: () => void; }

const API = 'https://vibely-reviews.trackerwanga254.workers.dev';

export default function ReviewPage({ onBack }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reviews`);
      const data = await res.json();
      setReviews(data?.reviews || []);
    } catch (e) {}
    setLoading(false);
  };

  const submitReview = async () => {
    if (!name.trim() || !comment.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rating, comment: comment.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setName(''); setComment(''); setRating(5);
        loadReviews();
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const likeReview = async (reviewId: string) => {
    try {
      await fetch(`${API}/reviews/${reviewId}/like`, { method: 'POST' });
      loadReviews();
    } catch (e) {}
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #06060e 0%, #0a0a18 100%)', color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ 
            width: '64px', height: '64px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px'
          }}>
            ⭐
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>Reviews</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Share your experience with Vibely</p>
        </div>

        {/* Rating Summary */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px',
          padding: '16px', marginTop: '16px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#f59e0b' }}>{avgRating}</div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} fill={s <= Math.round(Number(avgRating)) ? '#f59e0b' : 'none'} color="#f59e0b" />
              ))}
            </div>
          </div>
          <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{reviews.length}</div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>Reviews</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        {/* Submit Form */}
        {!submitted ? (
          <div style={{ 
            padding: '24px', marginBottom: '32px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#a78bfa" /> Write a Review
            </h3>

            {/* Stars */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s', transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)' }}
                >
                  <Star size={36} fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} color={(hoverRating || rating) >= star ? '#f59e0b' : '#475569'} />
                </button>
              ))}
            </div>

            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              style={{ width: '100%', padding: '14px 16px', marginBottom: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9', fontSize: '14px', outline: 'none' }} />

            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What do you love about Vibely?" rows={4}
              style={{ width: '100%', padding: '14px 16px', marginBottom: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />

            {error && (
              <div style={{ padding: '12px', marginBottom: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f43f5e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button onClick={submitReview} disabled={submitting} className="btn-primary" style={{
              width: '100%', padding: '16px', fontSize: '15px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: submitting ? 0.7 : 1, borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', border: 'none', color: '#fff', cursor: 'pointer'
            }}>
              {submitting ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '32px', marginBottom: '32px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>Thank You! 🎉</div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Your review helps Vibely grow and reach more music lovers.</p>
            <button onClick={() => setSubmitted(false)} style={{ marginTop: '16px', background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              Write Another Review
            </button>
          </div>
        )}

        {/* Reviews List */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="#a78bfa" />
          {reviews.length > 0 ? `Reviews (${reviews.length})` : 'No reviews yet'}
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader size={32} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            <Star size={48} style={{ marginBottom: '12px', opacity: 0.2 }} />
            <div style={{ fontSize: '15px', color: '#94a3b8' }}>Be the first to review Vibely!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    {(review.name || 'A')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{review.name || 'Anonymous'}</div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} fill={s <= review.rating ? '#f59e0b' : 'none'} color={s <= review.rating ? '#f59e0b' : '#475569'} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => likeReview(review.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)',
                    borderRadius: '20px', color: '#f43f5e', fontSize: '12px', cursor: 'pointer', fontWeight: 500
                  }}>
                    <Heart size={14} /> {review.likes || 0}
                  </button>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '8px' }}>{review.comment}</p>
                <div style={{ color: '#475569', fontSize: '11px' }}>
                  {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={loadReviews} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', marginTop: '20px', padding: '12px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', color: '#64748b', fontSize: '13px', cursor: 'pointer'
        }}>
          <RefreshCw size={14} /> Refresh Reviews
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
