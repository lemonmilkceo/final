'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 px-5">
      <div className="space-y-4">
        {/* 사업자 정보 */}
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-gray-700">레몬밀크AI</p>
          <div className="text-[12px] text-gray-500 space-y-0.5">
            <p>대표: 이현승</p>
            <p>사업자등록번호: 499-24-02238</p>
            <p>통신판매업 신고번호: 제2026-서울강남-00893호</p>
            <p>주소: 서울특별시 강남구 역삼로 512, 5층-772(대치동, 인테크빌딩)</p>
            <p>연락처: 010-5375-0414</p>
          </div>
        </div>

        {/* 링크 */}
        <div className="flex items-center gap-3 text-[12px] text-gray-500">
          <Link href="/terms" className="hover:text-gray-700">
            이용약관
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="hover:text-gray-700">
            개인정보처리방침
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/refund" className="hover:text-gray-700">
            환불정책
          </Link>
        </div>

        {/* 저작권 */}
        <p className="text-[11px] text-gray-400">
          © 2026 레몬밀크AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
