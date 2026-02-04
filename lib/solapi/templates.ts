/**
 * Solapi 알림톡 템플릿 빌더
 * 카카오 비즈니스 채널에 등록된 템플릿과 동일한 형식으로 메시지 생성
 */

/**
 * 템플릿 ID 상수
 * Solapi에서 승인받은 템플릿 ID를 여기에 정의
 * 
 * 주의: Solapi 템플릿 ID는 알리고와 다른 형식입니다.
 * 예: KA01TP240000000000000000000000000
 */
export const TEMPLATE_IDS = {
  // 계약서 서명 요청
  CONTRACT_SIGN_REQUEST: process.env.SOLAPI_TEMPLATE_CONTRACT_SIGN || '',
} as const;

/**
 * 계약서 서명 요청 알림톡 변수 생성
 */
export function buildContractSignRequestVariables(params: {
  workerName: string;
  workplaceName: string;
  shareUrl: string;
}): {
  templateId: string;
  variables: Record<string, string>;
} {
  const { workerName, workplaceName, shareUrl } = params;

  // Solapi 템플릿 변수
  // 템플릿에서 정의한 변수명과 정확히 일치해야 함
  // 주의: URL 변수는 프로토콜(https://) 없이 전달 (템플릿에서 https://#{URL} 형식으로 사용)
  
  // shareUrl에서 프로토콜 제거
  const urlWithoutProtocol = shareUrl.replace(/^https?:\/\//, '');
  
  return {
    templateId: TEMPLATE_IDS.CONTRACT_SIGN_REQUEST,
    variables: {
      '#{고객명}': workerName,
      '#{사업장명}': workplaceName,
      '#{URL}': urlWithoutProtocol,
    },
  };
}

/**
 * 계약서 수정 알림 변수 생성 (향후 확장용)
 */
export function buildContractModifiedVariables(params: {
  workerName: string;
  workplaceName: string;
  shareUrl: string;
}): {
  templateId: string;
  variables: Record<string, string>;
} {
  const { workerName, workplaceName, shareUrl } = params;

  // shareUrl에서 프로토콜 제거
  const urlWithoutProtocol = shareUrl.replace(/^https?:\/\//, '');
  
  return {
    templateId: TEMPLATE_IDS.CONTRACT_SIGN_REQUEST, // 동일 템플릿 사용 또는 별도 템플릿
    variables: {
      '#{고객명}': workerName,
      '#{사업장명}': workplaceName,
      '#{URL}': urlWithoutProtocol,
    },
  };
}
