'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get('plan_id');

    const [plan, setPlan] = useState<any>(null);
    const [method, setMethod] = useState('cash');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!planId) {
            router.push('/dashboard/subscribe');
            return;
        }

        const fetchPlan = async () => {
            try {
                const res = await api.get('/subscriptions/plans');
                const selected = res.data.plans.find((p: any) => p.id === Number(planId));
                if (!selected) {
                    router.push('/dashboard/subscribe');
                } else {
                    setPlan(selected);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [planId, router]);

    const handleCheckout = async () => {
        setProcessing(true);
        try {
            // MOCK: Simulate API delay for payment gateway
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await api.post('/subscriptions/checkout', {
                plan_id: plan.id,
                payment_method: method
            });

            if (method === 'cash') {
                alert('Your subscription is pending admin approval. Please contact support after making the transfer.');
                router.push('/dashboard/subscribe');
            } else {
                // Success, redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Checkout failed');
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Loading checkout...</div>;
    if (!plan) return null;

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Checkout</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>Complete your subscription to access MASP.</p>

            <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{plan.name} Plan</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Billing: Monthly</p>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>
                        ${plan.price}
                    </div>
                </div>

                <h3 style={{ fontSize: 16, marginBottom: 16, fontWeight: 600 }}>Select Payment Method</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>

                    <label style={{
                        padding: 16,
                        border: `1px solid ${method === 'cash' ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12,
                        background: method === 'cash' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <input type="radio" name="method" checked={method === 'cash'} onChange={() => setMethod('cash')} style={{ accentColor: '#7c3aed', width: 16, height: 16 }} />
                        <span style={{ fontWeight: 500 }}>Cash / Manual Bank Transfer</span>
                    </label>

                    <label style={{
                        padding: 16,
                        border: `1px solid ${method === 'stripe' ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12,
                        background: method === 'stripe' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <input type="radio" name="method" checked={method === 'stripe'} onChange={() => setMethod('stripe')} style={{ accentColor: '#7c3aed', width: 16, height: 16 }} />
                        <span style={{ fontWeight: 500 }}>Credit Card (Stripe)</span>
                    </label>

                    <label style={{
                        padding: 16,
                        border: `1px solid ${method === 'paypal' ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12,
                        background: method === 'paypal' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <input type="radio" name="method" checked={method === 'paypal'} onChange={() => setMethod('paypal')} style={{ accentColor: '#7c3aed', width: 16, height: 16 }} />
                        <span style={{ fontWeight: 500 }}>PayPal</span>
                    </label>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                        <span>${plan.price}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                        <span>$0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: 18 }}>
                        <span>Total</span>
                        <span>${plan.price}</span>
                    </div>
                </div>

                <button
                    className="btn-glow"
                    onClick={handleCheckout}
                    disabled={processing}
                    style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 600 }}
                >
                    {processing ? 'Processing Secure Payment...' : `Subscribe via ${method.charAt(0).toUpperCase() + method.slice(1)}`}
                </button>
                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                </div>
            </div>
        </div>
    );
}
