'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  credits: number;
  price: number;
}

interface PaymentWidgetProps {
  product: Product;
  userId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

// 토스페이먼츠 결제위젯 클라이언트 키
// TODO: 토스 심사 후 라이브 키로 변경
// 환경변수가 빈 문자열인 경우에도 fallback 적용
const envKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const CLIENT_KEY = (envKey && envKey.trim() !== '') ? envKey : 'test_gck_Gv6LjeKD8a6BwweDB04L3wYxAdXy';

export default function PaymentWidget({
  product,
  userId,
  onSuccess,
  onError,
  onClose,
}: PaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        console.log('[PaymentWidget] Initializing with CLIENT_KEY:', CLIENT_KEY);
        console.log('[PaymentWidget] userId (customerKey):', userId);
        
        const tossPayments = await loadTossPayments(CLIENT_KEY);
        console.log('[PaymentWidget] TossPayments loaded');
        
        // 위젯 초기화
        // 토스 위젯은 customerKey 형식에 제한이 있음 (영문, 숫자, _, - 만 허용, 2~50자)
        const isGuest = userId.startsWith('guest_');
        console.log('[PaymentWidget] isGuest:', isGuest);
        
        let widgetsInstance: TossPaymentsWidgets;
        
        if (isGuest) {
          // 비회원 결제: customerKey를 생략하면 익명 결제로 처리됨
          widgetsInstance = tossPayments.widgets({});
          console.log('[PaymentWidget] Anonymous mode (no customerKey)');
        } else {
          // 회원 결제: UUID 형식의 customerKey 사용
          const safeCustomerKey = userId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
          console.log('[PaymentWidget] Safe customerKey:', safeCustomerKey);
          widgetsInstance = tossPayments.widgets({
            customerKey: safeCustomerKey,
          });
        }

        setWidgets(widgetsInstance);
        console.log('[PaymentWidget] Widgets instance created');

        // 결제 금액 설정
        await widgetsInstance.setAmount({
          currency: 'KRW',
          value: product.price,
        });
        console.log('[PaymentWidget] Amount set:', product.price);

        // 결제 수단 위젯 렌더링
        if (paymentMethodRef.current) {
          await widgetsInstance.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          });
          console.log('[PaymentWidget] Payment methods rendered');
        }

        // 약관 동의 위젯 렌더링
        if (agreementRef.current) {
          await widgetsInstance.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });
          console.log('[PaymentWidget] Agreement rendered');
        }

        setIsLoading(false);
        console.log('[PaymentWidget] Widget initialization complete');
      } catch (error) {
        console.error('[PaymentWidget] Init error:', error);
        console.error('[PaymentWidget] Error details:', JSON.stringify(error, null, 2));
        onError('결제 위젯을 불러오는데 실패했어요');
      }
    }

    initWidget();
  }, [product.price, userId, onError]);

  const handlePayment = async () => {
    if (!widgets) return;

    try {
      // 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 결제 준비 API 호출
      const prepareResponse = await fetch('/api/payment/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: product.id,
          amount: product.price,
          credits: product.credits,
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error('결제 준비에 실패했어요');
      }

      // 토스페이먼츠 결제 요청
      await widgets.requestPayment({
        orderId,
        orderName: product.name,
        successUrl: `${window.location.origin}/api/payment/confirm`,
        failUrl: `${window.location.origin}/pricing?error=payment_failed`,
        customerEmail: undefined,
        customerName: undefined,
        customerMobilePhone: undefined,
      });
    } catch (error: unknown) {
      console.error('Payment request error:', error);
      console.error('Payment request error (full):', JSON.stringify(error, null, 2));
      
      // 사용자가 결제를 취소한 경우
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        const errorMessage = (error as { message?: string }).message || '';
        
        if (errorCode === 'USER_CANCEL') {
          onClose();
          return;
        }
        
        // 토스페이먼츠 에러 코드별 메시지
        console.error(`[TossPayments Error] Code: ${errorCode}, Message: ${errorMessage}`);
        onError(`결제 실패: ${errorMessage || errorCode}`);
        return;
      }
      
      onError('결제 요청에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900">결제하기</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center -mr-2"
          >
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* 상품 정보 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-[14px] text-gray-500 mb-1">결제 상품</p>
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-gray-900">
                {product.name}
              </span>
              <span className="text-[16px] font-bold text-blue-500">
                {product.price.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner variant="inline" />
            </div>
          )}

          {/* 결제 수단 */}
          <div
            id="payment-method"
            ref={paymentMethodRef}
            className={isLoading ? 'hidden' : ''}
          />

          {/* 약관 동의 */}
          <div
            id="agreement"
            ref={agreementRef}
            className={isLoading ? 'hidden' : 'mt-4'}
          />
        </div>

        {/* 결제 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '로딩 중...' : `${product.price.toLocaleString()}원 결제하기`}
          </button>
        </div>
      </div>
    </div>
  );
}
