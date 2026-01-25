'use client';

import PageHeader from '@/components/layout/PageHeader';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="환불정책" />
      
      <div className="px-5 py-6 prose prose-sm max-w-none">
        <p className="text-[13px] text-gray-500 mb-6">
          <strong>시행일</strong>: 2026년 1월 25일<br />
          <strong>서비스명</strong>: 싸인해주세요<br />
          <strong>제공자</strong>: 레몬밀크AI
        </p>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제1조 (현재 서비스 요금 정책)</h2>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-[16px] font-bold text-green-800 mb-2">
            🎉 본 서비스는 현재 무료로 제공됩니다!
          </p>
          <p className="text-[14px] text-green-700">
            레몬밀크AI가 제공하는 &quot;싸인해주세요&quot; 서비스는 현재 베타 서비스로 운영되며, 모든 기능을 무료로 이용하실 수 있습니다. 따라서 현재 시점에서는 별도의 결제 및 환불 절차가 발생하지 않습니다.
          </p>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제2조 (유료 서비스 전환 시 적용 규정)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
          향후 서비스가 유료로 전환되는 경우, 다음의 환불 및 취소 규정이 적용됩니다.
        </p>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">1. 청약 철회 가능 기간</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>유료 서비스 결제일로부터 <strong>7일 이내</strong>에 청약 철회를 요청할 수 있습니다.</li>
          <li>단, 아래 제3조에 해당하는 경우에는 청약 철회가 제한될 수 있습니다.</li>
        </ul>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">2. 청약 철회 방법</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>서비스 내 설정 메뉴를 통한 환불 요청</li>
          <li>고객센터 이메일을 통한 환불 요청</li>
        </ul>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">3. 환불 처리 기간</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>환불 요청일로부터 영업일 기준 <strong>3일 이내</strong> 처리</li>
          <li>결제 수단에 따라 실제 환불 완료까지 추가 시간이 소요될 수 있습니다.</li>
        </ul>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제3조 (청약 철회 제한 사항) ⚠️ 중요</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-[14px] text-amber-800 mb-3">
            본 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라, 다음의 경우 청약 철회가 제한됩니다.
          </p>
          <p className="text-[14px] font-semibold text-amber-800 mb-2">
            디지털 콘텐츠의 특성에 따른 제한:
          </p>
          <ul className="text-[14px] text-amber-700 list-disc pl-5 space-y-1">
            <li><strong>계약서 발송 완료</strong>: 작성한 근로계약서를 카카오톡 등으로 상대방에게 발송한 경우</li>
            <li><strong>계약서 서명 완료</strong>: 상대방(피고용인)이 전자서명을 완료한 경우</li>
            <li><strong>PDF 다운로드</strong>: 완성된 계약서를 PDF 형태로 다운로드한 경우</li>
          </ul>
        </div>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제4조 (구독 서비스 해지 규정)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
          향후 월간/연간 구독 서비스가 도입되는 경우, 다음 규정이 적용됩니다.
        </p>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">1. 구독 해지</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>이용자는 언제든지 구독을 해지할 수 있습니다.</li>
          <li>해지 시점 이후의 구독료는 청구되지 않습니다.</li>
        </ul>

        <h3 className="text-[16px] font-semibold text-gray-800 mt-6 mb-3">2. 잔여 기간 환불</h3>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li><strong>월간 구독</strong>: 해지 요청 시점부터 구독 종료일까지 잔여 일수에 해당하는 금액을 일할 계산하여 환불합니다.</li>
          <li><strong>연간 구독</strong>: 사용 개월 수를 월간 구독 정가로 계산한 금액을 차감한 나머지를 환불합니다.</li>
        </ul>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제5조 (환불이 불가능한 경우)</h2>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li>이용자의 귀책사유로 서비스 이용이 제한된 경우</li>
          <li>본 약관 위반으로 인해 이용 계약이 해지된 경우</li>
          <li>무료 이벤트, 프로모션 등을 통해 무상으로 제공받은 서비스</li>
          <li>제3조에 따라 청약 철회가 제한되는 경우</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제6조 (오류로 인한 결제 취소)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
          결제 시스템 오류, 이중 결제 등 이용자의 귀책사유가 아닌 경우에는 즉시 결제 취소 및 환불 처리합니다.
        </p>
        <ul className="text-[15px] text-gray-700 leading-relaxed list-disc pl-5 space-y-2">
          <li>오류 발생 확인 즉시 고객센터로 연락</li>
          <li>확인 후 영업일 기준 3일 이내 처리</li>
        </ul>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제7조 (서비스 종료 시 환불)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
          회사의 사정으로 서비스가 종료되는 경우, 다음과 같이 처리합니다:
        </p>
        <ol className="text-[15px] text-gray-700 leading-relaxed list-decimal pl-5 space-y-2">
          <li>서비스 종료일로부터 최소 30일 전 사전 공지</li>
          <li>유료 서비스 이용 중인 회원에게 잔여 기간에 해당하는 금액 환불</li>
          <li>이용자 데이터 백업 기간 제공 (최소 30일)</li>
        </ol>

        <h2 className="text-[18px] font-bold text-gray-900 mt-8 mb-4">제8조 (분쟁 해결)</h2>
        <p className="text-[15px] text-gray-700 leading-relaxed">
          본 규정과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 원만한 해결을 위해 성실히 협의합니다. 협의가 이루어지지 않는 경우, 「전자상거래 등에서의 소비자보호에 관한 법률」 및 관계 법령에 따릅니다.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-[14px] text-gray-500">
            본 환불 및 취소 규정은 2026년 1월 25일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
