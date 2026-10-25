import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Star, MessageSquare, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Response Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (id, status) => {
    try {
      await api.patch(`/admin/reviews/${id}/moderation`, { status });
      setMsg({ type: 'success', text: `Review status changed to ${status}.` });
      fetchReviews();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update moderation.' });
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!activeReview) return;
    setSubmitting(true);

    try {
      await api.post(`/admin/reviews/${activeReview.id}/response`, {
        response: responseText,
      });
      setMsg({ type: 'success', text: 'Workshop official reply published!' });
      setReplyModalOpen(false);
      setResponseText('');
      fetchReviews();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit response.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111]">Review Moderation & Feedback</h1>
        <p className="text-xs text-[#737373]">
          Manage verified customer reviews, publish approved feedback to the public website, and post official workshop replies.
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-[#EAB308]">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-xs text-[#111111]">{r.rating} / 5 Stars</span>
                <span className="text-neutral-400">•</span>
                <span className="text-xs font-semibold text-neutral-800">{r.customer_name} ({r.customer_phone})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  r.moderation_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {r.moderation_status}
                </span>

                <select
                  value={r.moderation_status}
                  onChange={(e) => handleModerate(r.id, e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-[#E5E5E5] bg-neutral-50"
                >
                  <option value="approved">Approve & Publish</option>
                  <option value="pending">Keep Pending</option>
                  <option value="rejected">Reject / Hide</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-[#171717] leading-relaxed">
              "{r.comment}"
            </p>

            <div className="text-[11px] text-[#737373]">
              Motorcycle: <strong>{r.bike_brand} {r.bike_model}</strong> • Booking: #{r.booking_reference} • Date: {new Date(r.created_at).toLocaleDateString()}
            </div>

            {r.admin_response ? (
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-950 space-y-1">
                <span className="font-bold text-[#EA580C] uppercase tracking-wider text-[10px] block">
                  Official Workshop Reply:
                </span>
                <p className="italic">"{r.admin_response}"</p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveReview(r);
                  setResponseText('');
                  setReplyModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] hover:underline pt-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Post Official Workshop Response
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {replyModalOpen && activeReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#111111]">
              Reply to {activeReview.customer_name}'s Review
            </h3>

            <form onSubmit={handleSendResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Official Response (Visible to Public) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank the rider for their visit or address their feedback professionally..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
