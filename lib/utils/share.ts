/**
 * 공유 관련 유틸리티
 */

/**
 * 계약서 공유 링크 복사
 * @param shareToken 계약서 공유 토큰
 * @returns 성공 여부
 */
export async function copyContractLink(shareToken: string): Promise<boolean> {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${shareToken}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 현대 브라우저 Clipboard API
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('링크 복사 실패:', error);
    return false;
  }
}

/**
 * 공유 URL 생성
 * @param shareToken 계약서 공유 토큰
 * @returns 공유 URL
 */
export function getContractShareUrl(shareToken: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/contract/sign/${shareToken}`;
}

/**
 * Web Share API를 통한 공유 (모바일 기본 공유)
 * @param params 공유 파라미터
 * @returns 성공 여부
 */
export async function shareViaWebAPI(params: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: params.title,
      text: params.text,
      url: params.url,
    });
    return true;
  } catch (error) {
    // 사용자가 취소한 경우도 포함
    if ((error as Error).name === 'AbortError') {
      return false;
    }
    console.error('Web Share API 실패:', error);
    return false;
  }
}
