'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { updateProfile } from './actions';

interface ProfilePageProps {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: 'employer' | 'worker' | null;
    avatar_url: string | null;
    created_at: string;
  };
}

export default function ProfilePage({ profile }: ProfilePageProps) {
  const router = useRouter();
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile({ name, phone });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || '저장에 실패했습니다.');
    }

    setIsLoading(false);
  };

  const roleLabel = profile.role === 'employer' ? '사업자' : '근로자';
  const roleBgColor = profile.role === 'employer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="프로필 설정" onBack={() => router.back()} />

      <div className="px-5 pt-6 pb-10">
        {/* 프로필 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          {/* 아바타 */}
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-4xl">😊</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">{profile.name || '사용자'}님</h2>
            <span className={`inline-block mt-1 text-[12px] font-medium px-2.5 py-0.5 rounded-full ${roleBgColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* 프로필 정보 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              이름
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              이메일
            </label>
            <Input
              type="email"
              value={profile.email || '이메일 없음'}
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-[12px] text-gray-400">카카오 계정에서 가져온 정보입니다</p>
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-[14px] rounded-xl">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 text-[14px] rounded-xl">
              프로필이 저장되었습니다.
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="pt-4">
            <Button type="submit" disabled={isLoading} loading={isLoading}>
              저장하기
            </Button>
          </div>
        </form>

        {/* 가입일 정보 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[13px] text-gray-400">
            가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
