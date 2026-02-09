'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import PaymentWidget from '@/components/payment/PaymentWidget';
import GuestBanner from '@/components/shared/GuestBanner';
import SignupPromptSheet from '@/components/shared/SignupPromptSheet';
import { formatCurrency } from '@/lib/utils/format';
import Footer from '@/components/layout/Footer';
import clsx from 'clsx';

interface PricingPageProps {
  currentCredits: {
    contract: number;
  };
  userId: string | null;
  isGuestMode?: boolean;
}

// 상품 정의
const PRODUCTS = [
  {
    id: 'credit_5',
    name: '계약서 5건',
    credits: 5,
    price: 4900,
    originalPrice: null,
    popular: false,
    description: '소규모 사업장 추천 · 결제 즉시 지급',
  },
  {
    id: 'credit_15',
    name: '계약서 15건',
    credits: 15,
    price: 12900,
    originalPrice: 14700,
    popular: true,
    description: '가장 많이 선택해요 · 12% 할인 적용',
  },
  {
    id: 'credit_50',
    name: '계약서 50건',
    credits: 50,
    price: 39000,
    originalPrice: 49000,
    popular: false,
    description: '대형 사업장 추천 · 20% 할인 적용',
  },
];

export default function PricingPage({
  currentCredits,
  userId,
  isGuestMode = false,
}: PricingPageProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[1]); // 기본 인기상품
  const [showPayment, setShowPayment] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSignupSheet, setShowSignupSheet] = useState(false);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setToastMessage('결제가 완료됐어요! 🎉');
    setShowToast(true);
    // 2초 후 새로고침
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  const handlePaymentError = (message: string) => {
    setShowPayment(false);
    setToastMessage(message || '결제에 실패했어요');
    setShowToast(true);
  };

  const getDiscount = (product: (typeof PRODUCTS)[0]) => {
    if (!product.originalPrice) return null;
    const discount = Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );
    return discount;
  };

  // 결제하기 버튼 클릭
  const handlePaymentClick = () => {
    if (isGuestMode || !userId) {
      setShowSignupSheet(true);
    } else {
      setShowPayment(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="크레딧 충전" />
      
      {/* 게스트 모드 배너 */}
      {isGuestMode && <GuestBanner />}

      <div className="flex-1 p-5">
        {/* 현재 보유 크레딧 - 게스트 모드에서는 가입 유도 메시지 */}
        {isGuestMode ? (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-[16px] font-bold text-gray-900 mb-1">
                  가입하면 무료 5건!
                </p>
                <p className="text-[13px] text-gray-600">
                  지금 가입하면 계약서 5건을 무료로 드려요
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 mb-6">
            <p className="text-[14px] text-gray-500 mb-2">현재 보유 크레딧</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[24px] font-bold text-gray-900">
                  {currentCredits.contract}
                  <span className="text-[14px] font-normal text-gray-500 ml-1">
                    건
                  </span>
                </p>
                <p className="text-[12px] text-gray-400">계약서 작성</p>
              </div>
            </div>
            <p className="text-[12px] text-blue-500 mt-3">
              💡 AI 노무사 검토는 무료로 이용할 수 있어요
            </p>
          </div>
        )}

        {/* 상품 목록 */}
        <div className="space-y-3 mb-6">
          <p className="text-[16px] font-semibold text-gray-900">
            충전할 크레딧 선택
          </p>

          {PRODUCTS.map((product) => {
            const isSelected = selectedProduct.id === product.id;
            const discount = getDiscount(product);

            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={clsx(
                  'w-full bg-white rounded-2xl p-5 text-left transition-all',
                  'border-2',
                  isSelected
                    ? 'border-blue-500 shadow-md'
                    : 'border-transparent'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[17px] font-bold text-gray-900">
                        {product.name}
                      </span>
                      {product.popular && (
                        <span className="bg-blue-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                          인기
                        </span>
                      )}
                      {discount && (
                        <span className="bg-red-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                          {discount}% 할인
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500">
                      {product.description}
                    </p>
                  </div>

                  <div className="text-right">
                    {product.originalPrice && (
                      <p className="text-[13px] text-gray-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </p>
                    )}
                    <p className="text-[18px] font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      건당{' '}
                      {formatCurrency(Math.round(product.price / product.credits))}
                    </p>
                  </div>
                </div>

                {/* 선택 인디케이터 */}
                <div className="mt-3 flex items-center justify-end">
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 크레딧 사용처 안내 */}
        <div className="bg-white rounded-xl p-4 mb-4 space-y-3">
          <p className="text-[14px] font-semibold text-gray-900">크레딧 사용 안내</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">📝</span>
              <div>
                <p className="text-[13px] font-medium text-gray-800">충전 경로</p>
                <p className="text-[12px] text-gray-500">이 페이지에서 원하는 크레딧 상품을 선택하고 결제</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✍️</span>
              <div>
                <p className="text-[13px] font-medium text-gray-800">사용처</p>
                <p className="text-[12px] text-gray-500">근로계약서 작성 시 1건당 1크레딧 차감</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">📅</span>
              <div>
                <p className="text-[13px] font-medium text-gray-800">유효기간</p>
                <p className="text-[12px] text-gray-500">구매일로부터 <strong>12개월</strong>간 유효 (환불도 12개월 이내)</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 사업자 정보 Footer */}
      <Footer />

      {/* 하단 결제 버튼 */}
      <div className="bg-white border-t border-gray-100 px-5 pt-3 pb-4 safe-bottom">
        <Button onClick={handlePaymentClick}>
          {isGuestMode ? (
            '가입하고 무료 5건 받기 🎁'
          ) : (
            `${formatCurrency(selectedProduct.price)} 결제하기`
          )}
        </Button>
      </div>

      {/* 결제 위젯 */}
      {showPayment && userId && (
        <PaymentWidget
          product={selectedProduct}
          userId={userId}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* 게스트 모드 회원가입 유도 시트 */}
      <SignupPromptSheet
        isOpen={showSignupSheet}
        onClose={() => setShowSignupSheet(false)}
        feature="create"
      />

      {/* 토스트 */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
