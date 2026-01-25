import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '싸인해주세요 | 간편한 근로계약서 작성',
  description:
    '10분이면 끝! 어려운 법률 용어 없이 질문에 답하기만 하면 근로계약서가 완성됩니다.',
  keywords: ['근로계약서', '알바', '계약서', '서명', '전자계약', 'AI 노무사'],
  authors: [{ name: 'SignPlease' }],
  openGraph: {
    title: '싸인해주세요 | 간편한 근로계약서 작성',
    description:
      '10분이면 끝! 어려운 법률 용어 없이 질문에 답하기만 하면 근로계약서가 완성됩니다.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '싸인해주세요',
  },
  twitter: {
    card: 'summary_large_image',
    title: '싸인해주세요 | 간편한 근로계약서 작성',
    description:
      '10분이면 끝! 어려운 법률 용어 없이 질문에 답하기만 하면 근로계약서가 완성됩니다.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오 SDK - integrity 제거 (CDN 측 파일 변경으로 인한 hash 불일치 방지) */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="container-mobile">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
