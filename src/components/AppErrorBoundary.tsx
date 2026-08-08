import React from 'react';

interface State { hasError: boolean }
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('Roza UI error', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#faf8f5', color: '#3a2f27', fontFamily: 'sans-serif' }}>
      <section style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1>رزا موقتاً آماده نیست</h1>
        <p>اطلاعات ذخیره‌شده شما دست‌نخورده است. برنامه را دوباره باز کنید.</p>
        <button onClick={() => location.reload()} style={{ border: 0, borderRadius: 14, padding: '12px 24px', background: '#8e5241', color: '#fff', fontWeight: 700 }}>تلاش دوباره</button>
      </section>
    </main>;
  }
}
