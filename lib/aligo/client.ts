/**
 * 알리고 알림톡 API 클라이언트
 * @see https://smartsms.aligo.in/admin/api/kakao.html
 */

import { normalizePhoneNumber, maskPhoneNumber } from '@/lib/utils/phone';

// 환경 변수 타입
interface AligoConfig {
  apiKey: string;
  userId: string;
  senderKey: string;
  senderPhone: string;
}

// 알림톡 발송 요청 타입
export interface AlimtalkSendRequest {
  receiver: string; // 수신자 전화번호 (01012345678 형식)
  templateCode: string; // 알림톡 템플릿 코드
  subject?: string; // 알림톡 제목 (템플릿에 따라 필수)
  message: string; // 알림톡 본문 (템플릿과 일치해야 함)
  buttonJson?: string; // 버튼 JSON (템플릿에 버튼이 있는 경우)
  failoverType?: 'S' | 'L' | 'N'; // 대체발송 타입 (S: SMS, L: LMS, N: 미사용)
}

// 알리고 API 응답 타입
export interface AligoResponse {
  code: number; // 0: 성공, 그 외: 실패
  message: string;
  info?: {
    type: string;
    mid: string; // 메시지 ID
    current: string;
    unit: string;
    total: string;
    scnt: string;
    fcnt: string;
  };
}

// 알림톡 발송 결과
export interface AlimtalkSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: number;
}

/**
 * 알리고 설정 가져오기
 */
function getConfig(): AligoConfig {
  const apiKey = process.env.ALIGO_API_KEY;
  const userId = process.env.ALIGO_USER_ID;
  const senderKey = process.env.ALIGO_SENDER_KEY;
  const senderPhone = process.env.SENDER_PHONE_NUMBER;

  if (!apiKey || !userId || !senderKey || !senderPhone) {
    throw new Error('알리고 설정이 누락되었습니다. 환경 변수를 확인해주세요.');
  }

  return { apiKey, userId, senderKey, senderPhone };
}

/**
 * 알림톡 발송 (단건)
 */
export async function sendAlimtalk(
  request: AlimtalkSendRequest
): Promise<AlimtalkSendResult> {
  // 알림톡 비활성화 체크
  if (process.env.ALIMTALK_ENABLED !== 'true') {
    console.log('[Alimtalk] 알림톡 비활성화 상태 - 발송 스킵');
    return {
      success: false,
      error: '알림톡이 비활성화되어 있습니다.',
      code: -1,
    };
  }

  try {
    const config = getConfig();
    const normalizedPhone = normalizePhoneNumber(request.receiver);

    // 요청 파라미터 구성
    const formData = new FormData();
    formData.append('apikey', config.apiKey);
    formData.append('userid', config.userId);
    formData.append('senderkey', config.senderKey);
    formData.append('tpl_code', request.templateCode);
    formData.append('sender', normalizePhoneNumber(config.senderPhone));
    formData.append('receiver_1', normalizedPhone);
    formData.append('subject_1', request.subject || '계약서 전송 안내');
    formData.append('message_1', request.message);

    // 버튼이 있는 경우 추가
    if (request.buttonJson) {
      formData.append('button_1', request.buttonJson);
    }

    // 대체발송 설정 (기본: 미사용)
    formData.append('failover', request.failoverType || 'N');

    // 로깅 (민감정보 마스킹)
    console.log('[Alimtalk] 발송 요청:', {
      receiver: maskPhoneNumber(normalizedPhone),
      templateCode: request.templateCode,
      failover: request.failoverType || 'N',
    });

    // API 호출
    const response = await fetch(
      'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result: AligoResponse = await response.json();

    console.log('[Alimtalk] API 응답:', {
      code: result.code,
      message: result.message,
      messageId: result.info?.mid,
    });

    if (result.code === 0) {
      return {
        success: true,
        messageId: result.info?.mid,
      };
    } else {
      return {
        success: false,
        error: result.message,
        code: result.code,
      };
    }
  } catch (error) {
    console.error('[Alimtalk] 발송 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      code: -999,
    };
  }
}

/**
 * 알림톡 템플릿 목록 조회 (개발용)
 */
export async function getTemplateList(): Promise<unknown> {
  try {
    const config = getConfig();

    const formData = new FormData();
    formData.append('apikey', config.apiKey);
    formData.append('userid', config.userId);
    formData.append('senderkey', config.senderKey);

    const response = await fetch(
      'https://kakaoapi.aligo.in/akv10/template/list/',
      {
        method: 'POST',
        body: formData,
      }
    );

    return await response.json();
  } catch (error) {
    console.error('[Alimtalk] 템플릿 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 알림톡 발송 결과 조회 (개발용)
 */
export async function getMessageDetail(
  mid: string,
  page: number = 1
): Promise<unknown> {
  try {
    const config = getConfig();

    const formData = new FormData();
    formData.append('apikey', config.apiKey);
    formData.append('userid', config.userId);
    formData.append('mid', mid);
    formData.append('page', String(page));

    const response = await fetch(
      'https://kakaoapi.aligo.in/akv10/history/detail/',
      {
        method: 'POST',
        body: formData,
      }
    );

    return await response.json();
  } catch (error) {
    console.error('[Alimtalk] 메시지 상세 조회 오류:', error);
    throw error;
  }
}
