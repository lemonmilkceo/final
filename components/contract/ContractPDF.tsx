'use client';

import { Ref } from 'react';

interface ContractPDFProps {
  data: {
    // 당사자 정보
    workplaceName?: string;
    employerName?: string;
    workerName: string;

    // 계약 형태
    contractType?: 'regular' | 'contract';

    // 급여 정보
    wageType: 'hourly' | 'monthly';
    hourlyWage?: number | null;
    monthlyWage?: number | null;
    includesWeeklyAllowance: boolean;
    payDay: number;
    paymentTiming: 'current_month' | 'next_month';
    isLastDayPayment: boolean;

    // 근무 조건
    startDate: string;
    endDate?: string | null;
    workDays?: string[] | null;
    workDaysPerWeek?: number | null;
    workStartTime: string;
    workEndTime: string;
    breakMinutes: number;
    workLocation: string;
    jobDescription?: string;
    specialTerms?: string; // 특약사항

    // 사업장 정보
    businessSize: 'under_5' | 'over_5';

    // 서명 정보
    employerSignature?: {
      signatureData?: string;
      signedAt?: string;
    };
    workerSignature?: {
      signatureData?: string;
      signedAt?: string;
    };

    // 메타 정보
    createdAt: string;
  };
  ref?: Ref<HTMLDivElement>;
}

function ContractPDF({ data, ref }: ContractPDFProps) {
  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 급여 표시
  const formatWage = () => {
    if (data.wageType === 'monthly' && data.monthlyWage) {
      return `월 ${formatCurrency(data.monthlyWage)}`;
    }
    if (data.hourlyWage) {
      return `시급 ${formatCurrency(data.hourlyWage)}${data.includesWeeklyAllowance ? ' (주휴수당 포함)' : ''}`;
    }
    return '-';
  };

  // 급여일 표시
  const formatPayDay = () => {
    const timing = data.paymentTiming === 'next_month' ? '익월' : '당월';
    const day = data.isLastDayPayment ? '말일' : `${data.payDay}일`;
    return `${timing} ${day}`;
  };

  // 근무요일 표시
  const formatWorkDays = () => {
    if (data.workDaysPerWeek) {
      return `주 ${data.workDaysPerWeek}일`;
    }
    if (data.workDays && data.workDays.length > 0) {
      return data.workDays.join(', ');
    }
    return '-';
  };

  // 휴일 계산
  const formatHolidays = () => {
    const allDays = ['월', '화', '수', '목', '금', '토', '일'];

    if (data.workDays && data.workDays.length > 0 && !data.workDaysPerWeek) {
      const holidays = allDays.filter((day) => !data.workDays?.includes(day));
      if (holidays.length === 0) return '없음';
      return holidays.join(', ');
    }

    if (data.workDaysPerWeek) {
      const holidayCount = 7 - data.workDaysPerWeek;
      if (holidayCount <= 0) return '없음';
      return `주 ${holidayCount}일`;
    }

    return '-';
  };

  // 계약기간 표시
  const formatContractPeriod = () => {
    const start = formatDate(data.startDate);
    const end = data.endDate ? formatDate(data.endDate) : '정함 없음';
    return `${start} ~ ${end}`;
  };

  // 계약 형태 표시
  const formatContractType = () => {
    return data.contractType === 'regular'
      ? '정규직 (4대보험)'
      : '계약직 (3.3%)';
  };

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        backgroundColor: 'white',
        fontFamily: '"Noto Sans KR", sans-serif',
        fontSize: '11pt',
        lineHeight: '1.6',
        color: '#191F28',
      }}
    >
      {/* 제목 */}
      <h1
        style={{
          fontSize: '24pt',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          letterSpacing: '8px',
        }}
      >
        표 준 근 로 계 약 서
      </h1>

      {/* 당사자 정보 */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={sectionTitleStyle}>1. 당사자</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>사업장명</td>
              <td style={valueCellStyle}>{data.workplaceName || '-'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>계약형태</td>
              <td style={valueCellStyle}>{formatContractType()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>사업주</td>
              <td style={valueCellStyle}>{data.employerName || '-'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>근로자</td>
              <td style={valueCellStyle}>{data.workerName}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 근로조건 */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={sectionTitleStyle}>2. 근로조건</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>계약기간</td>
              <td style={valueCellStyle}>{formatContractPeriod()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>근무장소</td>
              <td style={valueCellStyle}>{data.workLocation}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>업무내용</td>
              <td style={valueCellStyle}>{data.jobDescription || '-'}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>근무요일</td>
              <td style={valueCellStyle}>{formatWorkDays()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>휴일</td>
              <td style={valueCellStyle}>{formatHolidays()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>근무시간</td>
              <td style={valueCellStyle}>
                {data.workStartTime} ~ {data.workEndTime}
              </td>
            </tr>
            <tr>
              <td style={labelCellStyle}>휴게시간</td>
              <td style={valueCellStyle}>{data.breakMinutes}분</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 급여 */}
      <section style={{ marginBottom: '24px' }}>
        <h2 style={sectionTitleStyle}>3. 급여</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>급여</td>
              <td style={valueCellStyle}>{formatWage()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>급여일</td>
              <td style={valueCellStyle}>{formatPayDay()}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>사업장 규모</td>
              <td style={valueCellStyle}>
                {data.businessSize === 'under_5' ? '5인 미만' : '5인 이상'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 5인 이상 사업장 추가 항목 */}
      {data.businessSize === 'over_5' && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle}>4. 법정 사항 (5인 이상 사업장)</h2>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={labelCellStyle}>연차휴가</td>
                <td style={valueCellStyle}>근로기준법 제60조에 따라 부여</td>
              </tr>
              <tr>
                <td style={labelCellStyle}>가산수당</td>
                <td style={valueCellStyle}>
                  연장·야간·휴일 근로 시 통상임금의 50% 이상 가산
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* 특약사항 */}
      {data.specialTerms && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle}>
            {data.businessSize === 'over_5' ? '5' : '4'}. 특약사항
          </h2>
          <div
            style={{
              padding: '16px',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              backgroundColor: '#FAFAFA',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
            }}
          >
            {data.specialTerms}
          </div>
        </section>
      )}

      {/* 서명 영역 */}
      <section style={{ marginTop: '40px' }}>
        <h2 style={sectionTitleStyle}>
          {data.specialTerms
            ? data.businessSize === 'over_5' ? '6' : '5'
            : data.businessSize === 'over_5' ? '5' : '4'}. 서명
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
          }}
        >
          {/* 사업주 서명 */}
          <div style={signatureBoxStyle}>
            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>사업주</p>
            <div style={signatureAreaStyle}>
              {data.employerSignature?.signatureData ? (
                <img
                  src={data.employerSignature.signatureData}
                  alt="사업주 서명"
                  style={{ maxWidth: '100%', maxHeight: '60px' }}
                />
              ) : (
                <span style={{ color: '#9CA3AF' }}>서명 대기중</span>
              )}
            </div>
            <p style={{ marginTop: '10px', fontSize: '10pt' }}>
              {data.employerName || '사업주'}
            </p>
            <p style={{ fontSize: '9pt', color: '#6B7280' }}>
              {data.employerSignature?.signedAt
                ? formatDate(data.employerSignature.signedAt)
                : ''}
            </p>
          </div>

          {/* 근로자 서명 */}
          <div style={signatureBoxStyle}>
            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>근로자</p>
            <div style={signatureAreaStyle}>
              {data.workerSignature?.signatureData ? (
                <img
                  src={data.workerSignature.signatureData}
                  alt="근로자 서명"
                  style={{ maxWidth: '100%', maxHeight: '60px' }}
                />
              ) : (
                <span style={{ color: '#9CA3AF' }}>서명 대기중</span>
              )}
            </div>
            <p style={{ marginTop: '10px', fontSize: '10pt' }}>
              {data.workerName}
            </p>
            <p style={{ fontSize: '9pt', color: '#6B7280' }}>
              {data.workerSignature?.signedAt
                ? formatDate(data.workerSignature.signedAt)
                : ''}
            </p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer
        style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #E5E7EB',
          fontSize: '9pt',
          color: '#6B7280',
          textAlign: 'center',
        }}
      >
        <p>
          본 계약서는 근로기준법에 따라 작성되었으며, 양 당사자가 서명함으로써
          효력이 발생합니다.
        </p>
        <p style={{ marginTop: '8px' }}>작성일: {formatDate(data.createdAt)}</p>
        <p style={{ marginTop: '4px', fontSize: '8pt' }}>
          싸인해주세요 (signplease.vercel.app)
        </p>
      </footer>
    </div>
  );
}

// 스타일 상수
const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13pt',
  fontWeight: 'bold',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '2px solid #191F28',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const labelCellStyle: React.CSSProperties = {
  width: '25%',
  padding: '10px 12px',
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  fontWeight: '500',
  color: '#6B7280',
};

const valueCellStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
};

const signatureBoxStyle: React.CSSProperties = {
  width: '45%',
  textAlign: 'center',
};

const signatureAreaStyle: React.CSSProperties = {
  height: '80px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FAFAFA',
};

export default ContractPDF;
