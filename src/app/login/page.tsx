'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciais incorretas ou usuário inativo.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError('Erro de conexão ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #1e1b4b 0%, #09090b 100%)',
        padding: '20px',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(24, 24, 27, 0.75)',
          border: '1px solid rgba(63, 63, 70, 0.4)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'var(--font-display, sans-serif)',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#06b6d4' }}>Dental</span>GO
            <span style={{ color: '#a1a1aa', fontWeight: 400, marginLeft: '6px' }}>CRM</span>
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '6px' }}>
            Acesse o Cockpit Comercial do CRM
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              padding: '12px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: '#e4e4e7',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@dentalgo.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #3f3f46',
                color: '#fff',
                outline: 'none',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: '#e4e4e7',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #3f3f46',
                color: '#fff',
                outline: 'none',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            padding: '12px',
            background: 'rgba(147, 51, 234, 0.08)',
            border: '1px dashed rgba(147, 51, 234, 0.25)',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: '#c084fc', margin: 0, fontWeight: 600 }}>
            🔑 Primeiro acesso / Credenciais padrão:
          </p>
          <p style={{ fontSize: '0.75rem', color: '#d8b4fe', margin: '4px 0 0' }}>
            E-mail: <code>admin@dentalgo.com</code>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#d8b4fe', margin: '2px 0 0' }}>
            Senha: <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
