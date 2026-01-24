'use client';

import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/stores/guestStore';
import Image from 'next/image';

export default function GuestRoleSelectPage() {
  const router = useRouter();
  const { setGuestMode } = useGuestStore();

  const handleRoleSelect = (role: 'employer' | 'worker') => {
    setGuestMode(role);
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-5">
        <button onClick={() => router.back()} className="text-gray-500">
          ← 뒤로
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo-pencil.svg"
            alt="싸인해주세요"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="text-[24px] font-bold text-gray-900 mb-2">
            둘러보기
          </h1>
          <p className="text-[15px] text-gray-500">
            로그인 없이 체험해보세요
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* 사장님 */}
          <button
            onClick={() => handleRoleSelect('employer')}
            className="w-full bg-blue-50 rounded-2xl p-6 text-left active:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">👔</span>
              <div>
                <p className="text-[17px] font-bold text-gray-900 mb-1">
                  사장님으로 둘러보기
                </p>
                <p className="text-[14px] text-gray-500">
                  계약서 작성 체험하기
                </p>
              </div>
            </div>
          </button>

          {/* 알바생 */}
          <button
            onClick={() => handleRoleSelect('worker')}
            className="w-full bg-green-50 rounded-2xl p-6 text-left active:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🧑‍💼</span>
              <div>
                <p className="text-[17px] font-bold text-gray-900 mb-1">
                  알바생으로 둘러보기
                </p>
                <p className="text-[14px] text-gray-500">
                  경력 관리 체험하기
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-[13px] text-gray-400 text-center">
          게스트 모드에서는 일부 기능이 제한돼요
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="p-5 pb-8 text-center">
        <p className="text-[14px] text-gray-500 mb-3">
          이미 계정이 있으신가요?
        </p>
        <button
          onClick={() => router.push('/login')}
          className="text-[15px] font-semibold text-blue-500"
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}
