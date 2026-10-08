import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgentsApi, submitBillApi } from '../../api/client';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

const SubmitBill = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodType, setFoodType] = useState('Lunch');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [remarks, setRemarks] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    // Fetch active agents for dropdown
    getAgentsApi(true).then((res) => {
      setAgents(res.data);
      // Auto select current logged-in agent if available
      if (user?.agent) {
        const found = res.data.find(a => String(a._id) === String(user.agent._id || user.agent));
        if (found) {
          setSelectedAgentId(found._id);
          setEmployeeId(found.employeeId);
        } else if (res.data.length > 0) {
          setSelectedAgentId(res.data[0]._id);
          setEmployeeId(res.data[0].employeeId);
        }
      } else if (res.data.length > 0) {
        setSelectedAgentId(res.data[0]._id);
        setEmployeeId(res.data[0].employeeId);
      }
    }).catch(err => console.error(err));
  }, [user]);

  const handleAgentChange = (e) => {
    const agentId = e.target.value;
    setSelectedAgentId(agentId);
    const found = agents.find(a => String(a._id) === String(agentId));
    setEmployeeId(found ? found.employeeId : '');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, JPEG, and PNG images are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setError('');
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!selectedAgentId) {
      setError('Please select an Agent Name.');
      return false;
    }
    if (!date) {
      setError('Please select a Date.');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount paid must be greater than ₹0.');
      return false;
    }
    if (!paymentMethod) {
      setError('Please select a Payment Method.');
      return false;
    }
    if (!imageFile) {
      setError('Payment screenshot is required. Please upload proof of payment.');
      return false;
    }
    setError('');
    return true;
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('agentId', selectedAgentId);
      formData.append('date', date);
      formData.append('foodType', foodType);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('remarks', remarks);
      formData.append('screenshot', imageFile);

      const res = await submitBillApi(formData);
      setSuccessResult(res.data);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit food bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgentObj = agents.find(a => String(a._id) === String(selectedAgentId));

  if (successResult) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-emerald-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Food bill submitted successfully.</h2>
          <p className="text-sm text-slate-500 mt-1">Your bill has been recorded and is pending verification.</p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/70 text-left">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Bill Details</span>
              <span className="font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded">
                {successResult.bill?.billId}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Agent:</span>
                <span className="font-semibold">{successResult.bill?.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{successResult.bill?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(successResult.bill?.date).toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Food Type:</span>
                <span>{successResult.bill?.foodType}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSuccessResult(null);
                setAmount('');
                setRemarks('');
                setImageFile(null);
                setImagePreview(null);
              }}
              className="flex-1 rounded-xl bg-primary-900 py-3 text-sm font-bold text-white shadow-md hover:bg-primary-800"
            >
              + Submit Another Bill
            </button>
            <button
              onClick={() => navigate('/agent/my-bills')}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View My Bills
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Submit Food Bill</h1>
          <p className="text-xs sm:text-sm text-slate-500">Enter payment details and upload proof screenshot</p>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary-900 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Fast & Easy</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInitialSubmit} className="space-y-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* 1. Agent Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Agent Name <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedAgentId}
            onChange={handleAgentChange}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white font-medium focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
          >
            {agents.map((ag) => (
              <option key={ag._id} value={ag._id}>
                {ag.name} ({ag.employeeId})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Employee/Agent ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            2. Employee / Agent ID
          </label>
          <input
            type="text"
            disabled
            value={employeeId}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed"
          />
        </div>

        {/* 3. Date & Food Type (Grid on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Food Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white font-medium focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* 5. Amount Paid & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              5. Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6. Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white font-medium focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* 7. Payment Screenshot Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            7. Payment Screenshot <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center hover:border-primary-900 transition-colors bg-slate-50/50">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageChange}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full"
            />
            {imagePreview ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={imagePreview}
                  alt="Payment Preview"
                  className="max-h-48 rounded-xl object-contain border border-slate-200 shadow-sm"
                />
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Screenshot Selected (Tap to Change)
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-900 mb-2">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-700">Tap to Upload Screenshot / Photo</span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPG, JPEG, or PNG up to 10MB</span>
              </div>
            )}
          </div>
        </div>

        {/* 8. Optional Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            8. Optional Remarks
          </label>
          <textarea
            rows="2"
            placeholder="Add any additional note (e.g. dinner for late shift)..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-primary-900 focus:ring-2 focus:ring-primary-900/20 outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-primary-900 py-3.5 text-base font-bold text-white shadow-lg hover:bg-primary-800 transition-all active:scale-[0.99]"
        >
          Submit Food Bill
        </button>
      </form>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Bill Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Please review your submission details before confirming:</p>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Agent:</span>
              <span className="font-bold text-slate-900">{selectedAgentObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Agent ID:</span>
              <span className="font-semibold text-slate-700">{employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Date:</span>
              <span className="font-semibold text-slate-700">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Food Type:</span>
              <span className="font-semibold text-slate-700">{foodType}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-600 font-bold">Amount Paid:</span>
              <span className="font-extrabold text-emerald-600 text-base">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payment Method:</span>
              <span className="font-semibold text-slate-700">{paymentMethod}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Edit Details
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-primary-900 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-800 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubmitBill;
