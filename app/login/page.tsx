// src/app/login/page.tsx
'use client';
import React, { useState } from 'react';
import { signIn } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Logging in...');

    // Server Action akan otomatis melakukan redirect jika sukses
    const result = await signIn(email, password);

    if (result?.error) {
      setMessage(`Error: ${result.error}`);
    } 
    // Jika berhasil, kode di bawah ini tidak akan dieksekusi karena redirect sudah terjadi
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login Sistem Multi-Role</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      
      <button type="submit">Masuk</button>
      <p>{message}</p>
    </form>
  );
}