import React, { useEffect, useState } from 'react';
import { getUserPlan, getPaymentMethods, addPaymentMethod } from '../services/userService';
import './PaymentScreen.css';

const cardTypes = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const years = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i));

const updatePlan = async (plan) => {
  const token = localStorage.getItem('token');
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

const PaymentScreen = () => {
  const [plan, setPlan] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ cardType: cardTypes[0], name: '', number: '', expMonth: months[0], expYear: years[0] });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const planRes = await getUserPlan();
        setPlan(planRes.plan);
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
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
      setFormError('Failed to add payment method');
    }
    setFormLoading(false);
  };

  const handlePlanChange = async () => {
    setPlanLoading(true);
    try {
      const newPlan = plan === 'pro' ? 'free' : 'pro';
      const res = await updatePlan(newPlan);
      setPlan(res.plan);
    } catch (e) {
      // handle error
    }
    setPlanLoading(false);
  };

  return (
    <div className="payment-screen-bg">
      <div className="payment-screen-container">
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
            </div>
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
                    <div key={idx} className="payment-method-card">
                      <span className="payment-method-type">{pm.cardType}</span>
                      <span className="payment-method-last4">•••• {pm.last4}</span>
                      <span className="payment-method-exp">{pm.expMonth}/{pm.expYear}</span>
                      <span className="payment-method-name">{pm.name}</span>
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
    </div>
  );
};

export default PaymentScreen; 