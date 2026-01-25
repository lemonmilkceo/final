/**
 * FAQ 데이터 정의
 * 고객센터 자주 묻는 질문 목록
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'contract' | 'payment' | 'sign' | 'legal' | 'general';
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'contract-create',
    question: '계약서는 어떻게 작성하나요?',
    answer: `대시보드에서 '새 계약서 작성하기' 버튼을 누르면 간단한 질문에 답하는 것만으로 표준근로계약서가 자동으로 생성됩니다.

근로자 이름, 시급, 근무시간 등을 입력하면 됩니다.

작성된 계약서는 미리보기에서 확인하고, 서명 후 카카오톡으로 근로자에게 전송할 수 있어요.`,
    category: 'contract',
  },
  {
    id: 'credit-charge',
    question: '크레딧은 어떻게 충전하나요?',
    answer: `메뉴에서 '크레딧 충전'을 선택하면 다양한 크레딧 상품을 구매할 수 있어요.

계약서 작성 크레딧과 AI 노무사 검토 크레딧을 따로 또는 묶음으로 구매할 수 있습니다.

결제는 카카오페이, 토스페이 등 간편결제로 진행됩니다.`,
    category: 'payment',
  },
  {
    id: 'contract-send',
    question: '근로자에게 계약서는 어떻게 전달하나요?',
    answer: `계약서 작성이 완료되면 사장님이 먼저 서명을 합니다.

서명 완료 후 '카카오톡으로 보내기' 버튼을 누르면 근로자에게 알림이 전송됩니다.

근로자는 받은 링크를 통해 계약 내용을 확인하고 서명할 수 있어요.`,
    category: 'contract',
  },
  {
    id: 'sign-legal',
    question: '전자서명은 법적 효력이 있나요?',
    answer: `네, 법적 효력이 있습니다.

전자서명법에 따라 전자서명은 서명자의 의사표시로 인정되며, 종이 계약서와 동일한 법적 효력을 가집니다.

싸인해주세요에서 작성된 계약서는 서명 시각, IP 주소 등이 기록되어 법적 분쟁 시 증거로 활용할 수 있어요.`,
    category: 'legal',
  },
  {
    id: 'business-size',
    question: '5인 미만과 5인 이상 사업장의 차이는?',
    answer: `5인 이상 사업장은 근로기준법이 전면 적용됩니다.

주요 차이점:
• 5인 이상: 4대보험 의무 가입, 연장/야간/휴일 근로수당 지급 의무
• 5인 미만: 4대보험 선택 가입, 일부 조항 적용 제외

계약서 작성 시 사업장 규모를 선택하면 해당 규정에 맞는 계약서가 자동으로 생성됩니다.`,
    category: 'legal',
  },
  {
    id: 'payment-refund',
    question: '결제 취소 및 환불은 어떻게 하나요?',
    answer: `크레딧 사용 전이라면 결제 후 7일 이내 전액 환불이 가능합니다.

메뉴 > 결제 내역에서 환불 요청을 하거나, 1:1 문의를 통해 요청해주세요.

크레딧을 일부 사용한 경우에는 사용하지 않은 크레딧에 대해서만 환불이 가능합니다.`,
    category: 'payment',
  },
];

// 카테고리별 필터링 유틸
export function getFAQsByCategory(category: FAQItem['category']): FAQItem[] {
  return FAQ_DATA.filter((faq) => faq.category === category);
}

// ID로 FAQ 찾기
export function getFAQById(id: string): FAQItem | undefined {
  return FAQ_DATA.find((faq) => faq.id === id);
}
