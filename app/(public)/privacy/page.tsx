'use client';

import PageHeader from '@/components/layout/PageHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="개인정보처리방침" />
      
      <div className="px-5 py-6 prose prose-sm max-w-none">
        <p className="text-[13px] text-gray-500 mb-6">
          <strong>시행일</strong>: 2026년 1월 25일<br />
          <strong>서비스명</strong>: 싸인해주세요<br />
          <strong>제공자</strong>: 레몬밀크AI
        </p>

        <p className="text-[15px] text-gray-700 leading-relaxed">
          레몬밀크AI(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제1조 (개인정보의 처리 목적)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
          회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않습니다.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-gray-800">회원 가입 및 관리</p>
            <p className="text-[13px] text-gray-600">회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-800">서비스 제공</p>
            <p className="text-[13px] text-gray-600">전자 근로계약서 작성, 계약서 저장 및 관리, 카카오톡 공유 기능 제공</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-800">고객 문의 응대</p>
            <p className="text-[13px] text-gray-600">이용자 문의 접수 및 처리, 서비스 관련 안내</p>
          </div>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제2조 (수집하는 개인정보의 항목)</h2>
        
        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">1. 수집 항목</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-[14px] font-semibold text-gray-800">필수 항목 (카카오 로그인)</p>
            <p className="text-[13px] text-gray-600">카카오 고유 ID, 닉네임, 프로필 사진 → 회원 식별, 서비스 제공</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-800">근로계약서 작성 정보</p>
            <p className="text-[13px] text-gray-600">이름, 서명 이미지, 근무조건(임금, 근로시간, 근무지 등) → 근로계약서 작성 및 저장</p>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-800">자동 수집 정보</p>
            <p className="text-[13px] text-gray-600">서비스 이용 기록, 접속 로그, 접속 IP, 기기 정보 → 서비스 개선, 부정이용 방지</p>
          </div>
        </div>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">2. 수집 방법</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li><strong>카카오 로그인을 통한 자동 수집</strong>: 이용자가 카카오 계정으로 로그인할 때, 카카오로부터 동의된 정보를 자동으로 전달받습니다.</li>
          <li><strong>서비스 이용 과정에서 직접 입력</strong>: 이용자가 근로계약서 작성 시 직접 입력한 정보를 수집합니다.</li>
          <li><strong>서비스 이용 과정에서 자동 생성·수집</strong>: 서비스 이용 기록, 접속 로그 등이 자동으로 생성되어 수집될 수 있습니다.</li>
        </ul>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
          <p className="text-[14px] text-blue-800">
            <strong>참고</strong>: 본 서비스는 이메일을 수집하지 않습니다. 사업자 등록 미완료로 인해 카카오 로그인 시 이메일 정보는 제공되지 않습니다.
          </p>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">회원 정보</span>
            <span className="text-[14px] text-gray-600">회원 탈퇴 시까지</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">근로계약서 정보</span>
            <span className="text-[14px] text-gray-600">회원 탈퇴 시 또는 삭제 요청 시까지</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">서비스 이용 기록</span>
            <span className="text-[14px] text-gray-600">3년 (통신비밀보호법)</span>
          </div>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제4조 (개인정보의 파기 절차 및 방법)</h2>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
          <li>회원 탈퇴 시 해당 이용자의 개인정보는 <strong>즉시 파기</strong>됩니다.</li>
          <li>전자적 파일 형태는 복구 및 재생이 불가능하도록 기술적 방법을 사용하여 완전 삭제합니다.</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
          이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
        </p>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리정지 요구</li>
        </ul>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제6조 (개인정보의 안전성 확보조치)</h2>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li><strong>관리적 조치</strong>: 개인정보 취급자 최소화, 정기적 교육</li>
          <li><strong>기술적 조치</strong>: 개인정보처리시스템 접근 권한 관리, 개인정보 암호화, 보안 프로그램 설치</li>
          <li><strong>물리적 조치</strong>: 클라우드 서버(Supabase) 이용을 통한 안전한 데이터 저장</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제7조 (개인정보의 제3자 제공)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
          회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
        </p>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제8조 (개인정보 처리의 위탁)</h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">Supabase</span>
            <span className="text-[14px] text-gray-600">데이터베이스 호스팅</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">Vercel</span>
            <span className="text-[14px] text-gray-600">웹 서비스 호스팅</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[14px] text-gray-800">카카오</span>
            <span className="text-[14px] text-gray-600">소셜 로그인 서비스 제공</span>
          </div>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제9조 (쿠키의 설치·운영 및 거부)</h2>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키(cookie)를 사용합니다.</li>
          <li>이용자는 웹 브라우저에서 옵션을 설정함으로써 쿠키 저장을 거부할 수 있습니다.</li>
          <li>쿠키 저장을 거부할 경우, 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제10조 (권익침해 구제방법)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
          이용자는 개인정보침해로 인한 구제를 받기 위하여 다음 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다:
        </p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-[14px]">
          <p>• 개인정보분쟁조정위원회: 1833-6972</p>
          <p>• 개인정보침해신고센터: 118</p>
          <p>• 대검찰청 사이버수사과: 1301</p>
          <p>• 경찰청 사이버수사국: 182</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-[14px] text-gray-500">
            본 개인정보처리방침은 2026년 1월 25일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
