/**
 * 카카오톡 공유 SDK 유틸리티
 */

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: {
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }[];
}

/**
 * 카카오 SDK 초기화
 */
export function initKakao(): boolean {
  if (typeof window === 'undefined') return false;

  const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!appKey) {
    console.warn('Kakao JS Key가 설정되지 않았습니다.');
    return false;
  }

  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
  }

  return window.Kakao?.isInitialized() || false;
}

/**
 * 카카오톡으로 계약서 공유
 */
export function shareContractViaKakao(params: {
  workerName: string;
  shareUrl: string;
  employerName?: string;
}): boolean {
  if (typeof window === 'undefined' || !window.Kakao) {
    console.error('Kakao SDK가 로드되지 않았습니다.');
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    const initialized = initKakao();
    if (!initialized) return false;
  }

  const { workerName, shareUrl, employerName } = params;

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '📝 근로계약서가 도착했어요',
        description: `${employerName || '사업주'}님이 ${workerName}님에게 근로계약서를 보냈어요. 내용을 확인하고 서명해주세요.`,
        imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/images/og-contract.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '계약서 확인하기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('카카오톡 공유 실패:', error);
    return false;
  }
}
