import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Star,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  ShieldCheck,
  Bike
} from 'lucide-react';

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const preselectedBookingId = searchParams.get('booking_id');

  const [reviews, setReviews] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Submission Modal
  const [modalOpen, setModalOpen] = useState(!!preselectedBookingId);
  const [selectedBookingId, setSelectedBookingId] = useState(preselectedBookingId || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [revRes, bkRes] = await Promise.all([
        api.get('/customer/reviews'),
        api.get('/customer/bookings')
      ]);
      setReviews(revRes.data || []);

      // Filter bookings that are eligible for review:
      // Must be delivered + invoice status === 'paid' + outstanding_balance <= 0 + no existing review
      const existingReviewBookingIds = (revRes.data || []).map((r) => r.booking_id);
      const eligible = (bkRes.data || []).filter((b) =>
        (b.status === 'completed' || b.job_card_status === 'delivered') &&
        b.invoice_status === 'paid' &&
        parseFloat(b.outstanding_balance || 0) <= 0 &&
        !existingReviewBookingIds.includes(b.id)
      );

      setCompletedBookings(eligible);
      if (eligible.length > 0 && !selectedBookingId) {
        setSelectedBookingId(eligible[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load reviews data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError('Please select an eligible delivered service booking to review.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/customer/bookings/${selectedBookingId}/review`, {
        rating,
        comment,
      });
      setSuccess('Thank you! Your verified customer review has been submitted.');
      setModalOpen(false);
      setComment('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit review. Strict policy requires delivery and full invoice payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">Service Ratings & Reviews</h1>
          <p className="text-xs text-[#737373]">
            Verified customer reviews can be submitted once your motorcycle is delivered and the invoice is fully paid.
          </p>
        </div>

        {completedBookings.length > 0 && (
          <button
            onClick={() => {
              setError('');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-md shadow-orange-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Write a Review ({completedBookings.length} eligible)
          </button>
        )}
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Strict Policy Info Box */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-[#737373] leading-relaxed">
          <strong className="text-[#111111]">Verified Rider Review Standard:</strong> To prevent fake or duplicate reviews, BikeFix Club requires that: (1) The motorcycle service is marked <strong>Delivered</strong>, (2) The service invoice is <strong>Paid in Full</strong>, and (3) The review is submitted from your authenticated account.
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E5E5] space-y-3">
          <Star className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-[#111111]">No Reviews Submitted Yet</h3>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            Share your experience once your motorcycle service is delivered and invoice is paid.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-white border border-[#E5E5E5] space-y-3"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#EAB308]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-neutral-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#111111]">{r.rating} / 5 Stars</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#737373] font-mono">
                    Ref: #{r.booking_reference}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {r.moderation_status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold text-[#737373]">
                Motorcycle: <span className="text-[#111111]">{r.bike_brand} {r.bike_model}</span>
              </div>

              <p className="text-xs text-[#171717] leading-relaxed">
                "{r.comment}"
              </p>

              {r.admin_response && (
                <div className="mt-3 p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-950 space-y-1">
                  <span className="font-bold text-[#EA580C] uppercase tracking-wider text-[10px] block">
                    Workshop Management Response:
                  </span>
                  <p className="italic">"{r.admin_response}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <h3 className="text-lg font-bold text-[#111111]">Submit Verified Rider Review</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Select Delivered Service *
                </label>
                <select
                  required
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                >
                  {completedBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_reference} — {b.bike_brand} {b.bike_model} ({b.preferred_date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-2 text-[#EAB308]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star ? 'fill-current text-[#EAB308]' : 'text-neutral-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#111111] ml-2">{rating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Detailed Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the service quality, bike pickup, mechanic explanation, and parts cleanliness?..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E5E5E5] bg-[#F8F8F8] focus:bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
