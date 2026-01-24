'use client';

import { useRouter } from 'next/navigation';
import { useContractFormStore } from '@/stores/contractFormStore';
import clsx from 'clsx';

const EXAMPLE_TAGS = ['홀서빙', '주방보조', '음료 제조', '포장', '배달', '계산'];

export default function Step9JobDescription() {
  const router = useRouter();
  const { data, updateData } = useContractFormStore();

  const handleTagClick = (tag: string) => {
    const current = data.jobDescription.trim();
    if (current.includes(tag)) return;

    const newValue = current ? `${current}, ${tag}` : tag;
    updateData({ jobDescription: newValue });
  };

  const handlePreview = () => {
    if (data.jobDescription.trim()) {
      router.push('/employer/preview/new');
    }
  };

  const isValid = data.jobDescription.trim().length > 0;

  return (
    <>
      <div className="flex-1 px-6 pt-8 overflow-y-auto">
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-8">
          어떤 일을 하나요?
        </h1>

        {/* Textarea */}
        <textarea
          value={data.jobDescription}
          onChange={(e) => updateData({ jobDescription: e.target.value })}
          placeholder="업무 내용을 입력하세요"
          rows={4}
          autoFocus
          className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-[17px] text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Example Tags */}
        <p className="text-[14px] text-gray-400 mt-4 mb-2">자주 쓰는 예시</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-4 py-2 bg-gray-100 rounded-full text-[14px] text-gray-700 active:bg-gray-200 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4 safe-bottom">
        <button
          onClick={handlePreview}
          disabled={!isValid}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2',
            isValid
              ? 'bg-blue-500 text-white active:bg-blue-600'
              : 'bg-blue-300 text-white cursor-not-allowed'
          )}
        >
          계약서 미리보기
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
