import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { getUserPlan, getPaymentMethods, addPaymentMethod, setCurrentPaymentMethod, deletePaymentMethod } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import './PaymentScreen.css';
import { FaTrash } from 'react-icons/fa';

const cardTypes = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const years = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i));

const updatePlan = async (plan) => {
  const user = getCurrentUser();
  const token = user?.token || '';
  const res = await fetch('http://localhost:5000/api/user/plan', {
    method: 'PUT',
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ plan })
  });
  if (!res.ok) throw new Error('Failed to update plan');
  return res.json();
};

const PaymentScreen = ({ onBack }) => {
  // const navigate = useNavigate();
  const [plan, setPlan] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ cardType: cardTypes[0], name: '', number: '', expMonth: months[0], expYear: years[0] });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectCardModalOpen, setSelectCardModalOpen] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  useEffect(() => {
    // Remove token redirect logic; parent handles auth
    async function fetchData() {
      setLoading(true);
      try {
        const planRes = await getUserPlan();
        setPlan(planRes.plan);
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
        // If there's a current card, select it by default
        if (methods.length > 0) {
          setSelectedPaymentMethod(methods.find(m => m.current) || methods[0]);
        } else {
          setSelectedPaymentMethod(null);
        }
      } catch (e) {
        // handle error
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setForm({ cardType: cardTypes[0], name: '', number: '', expMonth: months[0], expYear: years[0] });
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError('');
    setFormLoading(false);
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPayment = async e => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    if (!form.name || !form.number || !form.expMonth || !form.expYear) {
      setFormError('All fields are required');
      setFormLoading(false);
      return;
    }
    if (!/^\d{16}$/.test(form.number)) {
      setFormError('Card number must be 16 digits');
      setFormLoading(false);
      return;
    }
    if (parseInt(form.expMonth) < 1 || parseInt(form.expMonth) > 12) {
      setFormError('Invalid expiration month');
      setFormLoading(false);
      return;
    }
    const currentYear = new Date().getFullYear();
    if (parseInt(form.expYear) < currentYear) {
      setFormError('Expiration year must be this year or later');
      setFormLoading(false);
      return;
    }
    try {
      const last4 = form.number.slice(-4);
      const method = {
        cardType: form.cardType,
        last4,
        expMonth: form.expMonth,
        expYear: form.expYear,
        name: form.name
      };
      const updated = await addPaymentMethod(method);
      setPaymentMethods(updated);
      setModalOpen(false);
    } catch (e) {
      let msg = 'Failed to add payment method';
      if (e && e.message) {
        try {
          const errObj = JSON.parse(e.message);
          if (errObj.msg) msg = errObj.msg;
        } catch { msg = e.message; }
      }
      setFormError(msg);
    }
    setFormLoading(false);
  };

  const handlePlanChange = async () => {
    setUpgradeError('');
    if (plan !== 'pro') {
      // Upgrade to pro: require card selection
      if (paymentMethods.length === 0) {
        setUpgradeError('You need to add and select a payment method first.');
        return;
      }
      setSelectCardModalOpen(true);
      return;
    }
    // Downgrade to free
    setPlanLoading(true);
    try {
      const res = await updatePlan('free');
      setPlan(res.plan);
    } catch (e) {
      // handle error
    }
    setPlanLoading(false);
  };

  const handleSelectPaymentMethod = async (pm) => {
    setPlanLoading(true);
    setUpgradeError('');
    try {
      // Persist current card selection to backend
      const updated = await setCurrentPaymentMethod({
        cardType: pm.cardType,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        name: pm.name
      });
      setPaymentMethods(updated);
      setSelectedPaymentMethod(updated.find(m => m.current));
      const res = await updatePlan('pro');
      setPlan(res.plan);
      setSelectCardModalOpen(false);
    } catch (e) {
      setUpgradeError('Failed to upgrade plan.');
    }
    setPlanLoading(false);
  };

  const handleDeletePaymentMethod = async (pm) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    try {
      // Call backend to delete
      const updated = await deletePaymentMethod({
        cardType: pm.cardType,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        name: pm.name
      });
      setPaymentMethods(updated);
      // If current was deleted, select another as current
      if (pm.current && updated.length > 0) {
        await setCurrentPaymentMethod(updated[0]);
        setSelectedPaymentMethod(updated[0]);
      } else if (updated.length === 0) {
        setSelectedPaymentMethod(null);
      }
    } catch (e) {
      alert('Failed to delete payment method.');
    }
  };

  return (
    <div className="payment-screen-bg">
      <div className="payment-screen-container">
        <div className="payment-header-banner">
          <button className="payment-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="payment-header-title">Payment</span>
        </div>
        <div className="payment-card">
          <h2 className="payment-title">Payment & Plan</h2>
          {loading ? (
            <div className="payment-loading">Loading...</div>
          ) : (
            <>
              <div className="payment-plan-section">
                <span className="payment-plan-label">Current Plan:</span>
                <span className={`payment-plan-value payment-plan-${plan}`}>{plan === 'pro' ? 'Pro' : 'Free'}</span>
                <button className="add-payment-btn" style={{ marginLeft: '1.5rem' }} onClick={handlePlanChange} disabled={planLoading}>
                  {planLoading ? 'Updating...' : plan === 'pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                </button>
                {plan === 'pro' && paymentMethods.length > 1 && (
                  <button className="add-payment-btn" style={{ marginLeft: '1rem' }} onClick={() => setSelectCardModalOpen(true)}>
                    Change Payment Method
                  </button>
                )}
              </div>
              {upgradeError && <div className="payment-error-msg">{upgradeError}</div>}
              <div className="payment-methods-section">
                <div className="payment-methods-header">
                  <span>Payment Methods</span>
                  <button className="add-payment-btn" onClick={handleOpenModal}>+ Add Payment Method</button>
                </div>
                {paymentMethods.length === 0 ? (
                  <div className="payment-methods-empty">No payment methods registered.</div>
                ) : (
                  <div className="payment-methods-list">
                    {paymentMethods.map((pm, idx) => (
                      <div key={idx} className={`payment-method-card${selectedPaymentMethod && pm === selectedPaymentMethod ? ' payment-method-selected' : ''}${pm.current ? ' payment-method-current' : ''}`}> 
                        <span className="payment-method-type">{pm.cardType}</span>
                        <span className="payment-method-last4">•••• {pm.last4}</span>
                        <span className="payment-method-exp">{pm.expMonth}/{pm.expYear}</span>
                        <span className="payment-method-name">{pm.name}</span>
                        {pm.current && <span className="payment-method-current-label">Current</span>}
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => handleDeletePaymentMethod(pm)} title="Delete">
                          <FaTrash color="#ff4444" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {modalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Payment Method</h2>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <form className="modal-body" onSubmit={handleAddPayment}>
                <div className="payment-form-row">
                  <label>Card Type:</label>
                  <select className="add-meal-select" name="cardType" value={form.cardType} onChange={handleFormChange}>
                    {cardTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="payment-form-row">
                  <label>Name on Card:</label>
                  <input className="add-meal-select" name="name" value={form.name} onChange={handleFormChange} />
                </div>
                <div className="payment-form-row">
                  <label>Card Number:</label>
                  <input className="add-meal-select" name="number" value={form.number} onChange={handleFormChange} maxLength={16} />
                </div>
                <div className="payment-form-row">
                  <label>Exp:</label>
                  <select className="add-meal-select" name="expMonth" value={form.expMonth} onChange={handleFormChange}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className="add-meal-select" name="expYear" value={form.expYear} onChange={handleFormChange}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {formError && <div style={{ color: '#ff4444', marginBottom: '1rem' }}>{formError}</div>}
                <button className="add-confirm-btn" type="submit" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add Payment Method'}</button>
              </form>
            </div>
          </div>
        )}
        {selectCardModalOpen && (
          <div className="modal-overlay" onClick={() => setSelectCardModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Select Payment Method</h2>
                <button className="modal-close" onClick={() => setSelectCardModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                {paymentMethods.map((pm, idx) => (
                  <div
                    key={idx}
                    className={`payment-method-card selectable${selectedPaymentMethod && pm === selectedPaymentMethod ? ' payment-method-selected' : ''}`}
                    onClick={() => handleSelectPaymentMethod(pm)}
                    style={{ cursor: 'pointer', marginBottom: '1rem' }}
                  >
                    <span className="payment-method-type">{pm.cardType}</span>
                    <span className="payment-method-last4">•••• {pm.last4}</span>
                    <span className="payment-method-exp">{pm.expMonth}/{pm.expYear}</span>
                    <span className="payment-method-name">{pm.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentScreen; 