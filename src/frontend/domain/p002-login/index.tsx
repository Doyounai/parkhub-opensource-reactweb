import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { I18nDomainResource } from './i18n';
import { useLogin } from '../../global/hook/useLogin';

const domainName = 'login';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutateAsync: login, isPending: isLoading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setValidationError('Please enter both username and password.');
      return;
    }
    setValidationError(null);

    try {
      await login({ username, password });
      navigate('/area');
    } catch (e: any) {
      // Error is already handled by hook state, but could also be processed here if needed
    }
  };

  const displayError = validationError || (error?.message);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans text-gray-900">
      <div className="w-full max-w-[420px] mx-4 p-6 sm:p-10 bg-white border border-gray-300 rounded-sm shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2 text-gray-900">Sign In</h1>
          <p className="text-gray-600 text-sm m-0">Parkhub System Access</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {displayError && (
            <div className="text-red-700 text-sm text-center bg-red-50 py-2 border border-red-200 rounded-sm">
              {displayError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-gray-900 text-base outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm text-gray-900 text-base outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-base font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default { JSX, i18n };