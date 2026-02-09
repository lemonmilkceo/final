'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/admin/auth';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const router = useRouter();

  // 남은 잠금 시간 계산
  const getRemainingLockTime = () => {
    if (!lockedUntil) return null;
    const remaining = lockedUntil - Date.now();
    if (remaining <= 0) {
      setLockedUntil(null);
      return null;
    }
    return Math.ceil(remaining / 60000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // IP 주소를 가져오기 위해 API 호출 (또는 고정값 사용)
      // 서버리스 환경에서는 실제 IP 추적이 어려우므로 간단한 식별자 사용
      const ip = 'admin-client';
      
      const result = await adminLogin(password, ip);
      
      if (result.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(result.error || '로그인에 실패했습니다');
        if (result.lockedUntil) {
          setLockedUntil(result.lockedUntil);
        }
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const remainingMinutes = getRemainingLockTime();
  const isLocked = remainingMinutes !== null && remainingMinutes > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 로고 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              싸인해주세요
            </h1>
            <p className="text-gray-500 mt-2">관리자 전용 페이지</p>
          </div>

          {/* 잠금 상태 표시 */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-red-600 font-medium">
                로그인이 일시적으로 잠겼습니다
              </p>
              <p className="text-red-500 text-sm mt-1">
                {remainingMinutes}분 후에 다시 시도해주세요
              </p>
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoFocus
                disabled={isLocked || loading}
              />
            </div>

            {/* 에러 메시지 */}
            {error && !isLocked && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading || !password || isLocked}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 안내 문구 */}
          <p className="text-center text-xs text-gray-400 mt-6">
            5회 실패 시 30분간 로그인이 제한됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
