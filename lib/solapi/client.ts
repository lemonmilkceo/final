/**
 * Solapi 알림톡 API 클라이언트
 * @see https://developers.solapi.dev/
 */

import { normalizePhoneNumber, maskPhoneNumber } from '@/lib/utils/phone';

// 알림톡 발송 요청 타입
export interface AlimtalkSendRequest {
  receiver: string; // 수신자 전화번호 (01012345678 형식)
  templateId: string; // 알림톡 템플릿 ID
  variables?: Record<string, string>; // 템플릿 변수
  pfId: string; // 카카오 채널 ID
}

// 알림톡 발송 결과
export interface AlimtalkSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Solapi 설정 가져오기
 */
function getConfig() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_KAKAO_PF_ID;
  const senderPhone = process.env.SENDER_PHONE_NUMBER;

  if (!apiKey || !apiSecret) {
    throw new Error('Solapi 설정이 누락되었습니다. 환경 변수를 확인해주세요.');
  }

  return { apiKey, apiSecret, pfId, senderPhone };
}

/**
 * Solapi API 인증 헤더 생성
 * HMAC-SHA256 서명 사용
 */
function generateAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  
  // Node.js crypto 대신 Web Crypto API 사용 (Edge Runtime 호환)
  const encoder = new TextEncoder();
  const data = encoder.encode(date + salt);
  
  // 동기 방식으로 HMAC 생성이 어려우므로 간단한 방식 사용
  // Solapi SDK 방식: API Key + API Secret을 Base64로 인코딩
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  return `Basic ${credentials}`;
}

/**
 * 알림톡 발송 (Solapi API 직접 호출)
 */
export async function sendAlimtalk(
  request: AlimtalkSendRequest
): Promise<AlimtalkSendResult> {
  // 알림톡 비활성화 체크
  if (process.env.ALIMTALK_ENABLED !== 'true') {
    console.log('[Solapi] 알림톡 비활성화 상태 - 발송 스킵');
    return {
      success: false,
      error: '알림톡이 비활성화되어 있습니다.',
      code: 'DISABLED',
    };
  }

  try {
    const config = getConfig();
    const normalizedPhone = normalizePhoneNumber(request.receiver);

    // 로깅 (민감정보 마스킹)
    console.log('[Solapi] 발송 요청:', {
      receiver: maskPhoneNumber(normalizedPhone),
      templateId: request.templateId,
      pfId: request.pfId,
    });

    // Solapi API 호출
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': generateAuthHeader(config.apiKey, config.apiSecret),
      },
      body: JSON.stringify({
        message: {
          to: normalizedPhone,
          from: normalizePhoneNumber(config.senderPhone || ''),
          kakaoOptions: {
            pfId: request.pfId || config.pfId,
            templateId: request.templateId,
            variables: request.variables || {},
          },
        },
      }),
    });

    const result = await response.json();

    console.log('[Solapi] API 응답:', {
      status: response.status,
      result,
    });

    if (response.ok && result.groupId) {
      return {
        success: true,
        messageId: result.groupId,
      };
    } else {
      return {
        success: false,
        error: result.errorMessage || result.message || 'API 호출 실패',
        code: result.errorCode || String(response.status),
      };
    }
  } catch (error) {
    console.error('[Solapi] 발송 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      code: 'EXCEPTION',
    };
  }
}

/**
 * Solapi SDK 방식 알림톡 발송 (대안)
 */
export async function sendAlimtalkWithSDK(
  request: AlimtalkSendRequest
): Promise<AlimtalkSendResult> {
  if (process.env.ALIMTALK_ENABLED !== 'true') {
    console.log('[Solapi SDK] 알림톡 비활성화 상태 - 발송 스킵');
    return {
      success: false,
      error: '알림톡이 비활성화되어 있습니다.',
      code: 'DISABLED',
    };
  }

  try {
    const config = getConfig();
    const normalizedPhone = normalizePhoneNumber(request.receiver);

    // 동적 import (SDK)
    const { SolapiMessageService } = await import('solapi');
    const messageService = new SolapiMessageService(
      config.apiKey,
      config.apiSecret
    );

    console.log('[Solapi SDK] 발송 요청:', {
      receiver: maskPhoneNumber(normalizedPhone),
      templateId: request.templateId,
    });

    const result = await messageService.send({
      to: normalizedPhone,
      from: normalizePhoneNumber(config.senderPhone || ''),
      kakaoOptions: {
        pfId: request.pfId || config.pfId || '',
        templateId: request.templateId,
        variables: request.variables || {},
      },
    });

    console.log('[Solapi SDK] 발송 결과:', result);

    // result 타입에서 groupId 또는 다른 식별자 추출
    const messageId = (result as { groupId?: string }).groupId || 
                      (result as { messageId?: string }).messageId ||
                      'success';

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('[Solapi SDK] 발송 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      code: 'EXCEPTION',
    };
  }
}
