// src/app/signup/page.tsx
'use client';
import React, { useState } from 'react';
import { signUp } from './actions';
import { UserRole } from '@/lib/types';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('jobseeker'); // Tipe data UserRole
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Memproses pendaftaran...');

    const result = await signUp(email, password, role);

    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi dan login.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Daftar Akun Baru</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      
      <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
        <option value="jobseeker">Job Seeker</option>
        <option value="recruiter">Recruiter</option>
      </select>

      <button type="submit">Daftar</button>
      <p>{message}</p>
    </form>
  );
}