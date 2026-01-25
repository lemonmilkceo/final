import { redirect } from 'next/navigation';

interface ShortLinkPageProps {
  params: Promise<{ token: string }>;
}

/**
 * 단축 URL 리다이렉트
 * /s/[token] → /contract/sign/[token]
 * 
 * 카카오톡에서 긴 URL이 하이퍼링크로 전체 인식되지 않는 문제를 해결하기 위해
 * 짧은 URL을 제공합니다.
 */
export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { token } = await params;
  
  // 실제 계약서 서명 페이지로 리다이렉트
  redirect(`/contract/sign/${token}`);
}
