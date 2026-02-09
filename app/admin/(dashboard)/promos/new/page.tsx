'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPromoCode } from '../actions';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function NewPromoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [creditAmount, setCreditAmount] = useState('1');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [description, setDescription] = useState('');

  const handleGenerateCode = () => {
    setCode(generateRandomCode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!code.trim()) {
      setError('코드를 입력해주세요');
      setLoading(false);
      return;
    }

    const creditAmountNum = parseInt(creditAmount);
    if (isNaN(creditAmountNum) || creditAmountNum < 1) {
      setError('크레딧 수량은 1 이상이어야 합니다');
      setLoading(false);
      return;
    }

    const maxUsesNum = parseInt(maxUses);
    if (isNaN(maxUsesNum) || maxUsesNum < 1) {
      setError('최대 사용 횟수는 1 이상이어야 합니다');
      setLoading(false);
      return;
    }

    try {
      const result = await createPromoCode({
        code: code.trim(),
        creditAmount: creditAmountNum,
        maxUses: maxUsesNum,
        expiresAt: expiresAt || null,
        description: description.trim(),
      });

      if (result.success) {
        router.push('/admin/promos');
      } else {
        setError(result.error || '코드 생성에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/promos" className="text-gray-500 hover:text-gray-700">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">새 프로모션 코드</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로모션 코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: WELCOME2024"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                자동 생성
              </button>
            </div>
          </div>

          {/* 크레딧 수량 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지급 크레딧 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              min="1"
              placeholder="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 최대 사용 횟수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 사용 횟수 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              min="1"
              placeholder="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              이 코드를 사용할 수 있는 최대 횟수입니다
            </p>
          </div>

          {/* 만료일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              만료일
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              비워두면 만료되지 않습니다
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (내부용)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 2024년 신규 가입 이벤트"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/admin/promos"
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-center"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '생성 중...' : '코드 생성'}
          </button>
        </div>
      </form>
    </div>
  );
}
