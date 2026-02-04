/**
 * 알림톡 템플릿 빌더
 * 카카오 비즈니스 채널에 등록된 템플릿과 동일한 형식으로 메시지 생성
 */

/**
 * 템플릿 코드 상수
 * 카카오 비즈니스 채널에서 승인받은 템플릿 코드를 여기에 정의
 */
export const TEMPLATE_CODES = {
  // 계약서 서명 요청 (기본)
  CONTRACT_SIGN_REQUEST:
    process.env.ALIMTALK_TEMPLATE_CONTRACT_SIGN || 'TM_CONTRACT_SIGN',
} as const;

/**
 * 버튼 타입
 */
type ButtonType = 'WL' | 'AL' | 'BK' | 'MD' | 'DS' | 'BC' | 'BT' | 'AC';

interface TemplateButton {
  name: string; // 버튼 이름 (최대 14자)
  linkType: ButtonType; // WL: 웹링크, AL: 앱링크, BK: 봇키워드, MD: 메시지전달
  linkTypeName?: string;
  linkMo?: string; // 모바일 링크
  linkPc?: string; // PC 링크
  linkAnd?: string; // 안드로이드 앱 링크
  linkIos?: string; // iOS 앱 링크
}

/**
 * 계약서 서명 요청 알림톡 생성
 *
 * [주의] 이 메시지는 카카오에 등록된 템플릿과 100% 일치해야 합니다.
 * 줄바꿈, 띄어쓰기 하나라도 다르면 발송 실패합니다.
 *
 * 등록된 템플릿 예시:
 * ---
 * #{고객명}님, 근로계약서가 도착했습니다.
 *
 * 사업장: #{사업장명}
 *
 * 아래 버튼을 눌러 계약서를 확인하고 서명해주세요.
 * 서명은 7일 이내에 완료해주세요.
 * ---
 */
export function buildContractSignRequestMessage(params: {
  workerName: string;
  workplaceName: string;
  shareUrl: string;
}): {
  templateCode: string;
  subject: string;
  message: string;
  buttonJson: string;
} {
  const { workerName, workplaceName, shareUrl } = params;

  // 템플릿 메시지 (카카오에 등록된 템플릿과 100% 일치해야 함)
  const message = `${workerName}님, 근로계약서가 도착했습니다.

사업장: ${workplaceName}

아래 버튼을 눌러 계약서를 확인하고 서명해주세요.
서명은 7일 이내에 완료해주세요.`;

  // 버튼 JSON
  const buttons: { button: TemplateButton[] } = {
    button: [
      {
        name: '계약서 확인하기',
        linkType: 'WL',
        linkTypeName: '웹링크',
        linkMo: shareUrl,
        linkPc: shareUrl,
      },
    ],
  };

  return {
    templateCode: TEMPLATE_CODES.CONTRACT_SIGN_REQUEST,
    subject: '근로계약서 서명 요청',
    message,
    buttonJson: JSON.stringify(buttons),
  };
}

/**
 * 계약서 수정 알림 메시지 생성 (향후 확장용)
 */
export function buildContractModifiedMessage(params: {
  workerName: string;
  workplaceName: string;
  shareUrl: string;
}): {
  templateCode: string;
  subject: string;
  message: string;
  buttonJson: string;
} {
  const { workerName, workplaceName, shareUrl } = params;

  const message = `${workerName}님, 근로계약서가 수정되었습니다.

사업장: ${workplaceName}

수정된 내용을 확인하고 다시 서명해주세요.
서명은 7일 이내에 완료해주세요.`;

  const buttons: { button: TemplateButton[] } = {
    button: [
      {
        name: '계약서 확인하기',
        linkType: 'WL',
        linkTypeName: '웹링크',
        linkMo: shareUrl,
        linkPc: shareUrl,
      },
    ],
  };

  return {
    templateCode: TEMPLATE_CODES.CONTRACT_SIGN_REQUEST, // 동일 템플릿 사용 또는 별도 템플릿
    subject: '근로계약서 수정 알림',
    message,
    buttonJson: JSON.stringify(buttons),
  };
}

/**
 * 템플릿 변수 치환 유틸리티
 * 향후 동적 템플릿 지원 시 사용
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `#{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}
