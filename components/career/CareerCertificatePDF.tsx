'use client';

import { forwardRef } from 'react';

interface CareerItem {
  id: string;
  workplaceName: string;
  jobDescription: string;
  startDate: string;
  endDate: string | null;
  resignationDate?: string | null;
  durationDays: number;
}

interface CareerCertificatePDFProps {
  data: {
    worker: {
      name: string;
      birthDate?: string;
    };
    careers: CareerItem[];
    totalDays: number;
    totalContracts: number;
    issueDate: string;
  };
}

const CareerCertificatePDF = forwardRef<HTMLDivElement, CareerCertificatePDFProps>(
  ({ data }, ref) => {
    // 날짜 포맷팅
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    // 기간 포맷팅
    const formatPeriod = (startDate: string, endDate: string | null) => {
      const start = new Date(startDate);
      const startStr = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}`;
      
      if (!endDate) {
        return `${startStr} ~ 현재`;
      }
      
      const end = new Date(endDate);
      const endStr = `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}`;
      return `${startStr} ~ ${endStr}`;
    };

    // 기간 일수 포맷팅
    const formatDuration = (days: number) => {
      if (days < 30) {
        return `${days}일`;
      }
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${months}개월`;
      }
      return `${months}개월`;
    };

    // 총 기간 포맷팅
    const formatTotalDuration = (days: number) => {
      if (days < 30) {
        return `${days}일`;
      }
      const years = Math.floor(days / 365);
      const remainingAfterYears = days % 365;
      const months = Math.floor(remainingAfterYears / 30);

      let result = '';
      if (years > 0) result += `${years}년 `;
      if (months > 0) result += `${months}개월`;
      return result.trim() || '0일';
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
            fontSize: '26pt',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
            letterSpacing: '12px',
          }}
        >
          근 무 이 력 서
        </h1>
        <p
          style={{
            textAlign: 'center',
            fontSize: '10pt',
            color: '#6B7280',
            marginBottom: '8px',
          }}
        >
          Work History Summary
        </p>
        <p
          style={{
            textAlign: 'center',
            fontSize: '9pt',
            color: '#9CA3AF',
            marginBottom: '30px',
          }}
        >
          📋 사인플리즈 계약 정보 기반 참고용 문서
        </p>

        {/* 1. 인적사항 */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle}>1. 인적사항</h2>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={labelCellStyle}>성명</td>
                <td style={valueCellStyle}>{data.worker.name}</td>
              </tr>
              {data.worker.birthDate && (
                <tr>
                  <td style={labelCellStyle}>생년월일</td>
                  <td style={valueCellStyle}>{data.worker.birthDate}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 2. 경력사항 */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle}>2. 경력사항</h2>
          <table style={{ ...tableStyle, marginTop: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F3F4F6' }}>
                <th style={headerCellStyle}>No.</th>
                <th style={headerCellStyle}>근무처</th>
                <th style={headerCellStyle}>직종/업무</th>
                <th style={headerCellStyle}>근무기간</th>
                <th style={headerCellStyle}>기간</th>
              </tr>
            </thead>
            <tbody>
              {data.careers.map((career, index) => (
                <tr key={career.id}>
                  <td style={{ ...dataCellStyle, textAlign: 'center', width: '8%' }}>
                    {index + 1}
                  </td>
                  <td style={{ ...dataCellStyle, width: '25%' }}>
                    {career.workplaceName}
                  </td>
                  <td style={{ ...dataCellStyle, width: '22%' }}>
                    {career.jobDescription}
                  </td>
                  <td style={{ ...dataCellStyle, width: '30%' }}>
                    {formatPeriod(career.startDate, career.endDate)}
                  </td>
                  <td style={{ ...dataCellStyle, textAlign: 'center', width: '15%' }}>
                    {formatDuration(career.durationDays)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 총 경력 요약 */}
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#EFF6FF',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              gap: '60px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4px' }}>
                총 근무 기간
              </p>
              <p style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1E40AF' }}>
                {formatTotalDuration(data.totalDays)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10pt', color: '#6B7280', marginBottom: '4px' }}>
                총 계약 건수
              </p>
              <p style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1E40AF' }}>
                {data.totalContracts}건
              </p>
            </div>
          </div>
        </section>

        {/* 안내 문구 (증명 → 참고용) */}
        <section style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '12pt', lineHeight: '2', color: '#4B5563' }}>
            위 내용은 사인플리즈에서 체결한 계약서 정보를 바탕으로 작성되었습니다.
          </p>
        </section>

        {/* 발급 정보 */}
        <section style={{ marginTop: '50px', textAlign: 'center' }}>
          <p style={{ fontSize: '12pt', marginBottom: '30px' }}>
            {formatDate(data.issueDate)}
          </p>
          <p style={{ fontSize: '14pt', fontWeight: 'bold' }}>
            싸인해주세요 (SignPlease)
          </p>
          <p style={{ fontSize: '10pt', color: '#6B7280', marginTop: '4px' }}>
            전자근로계약서 플랫폼
          </p>
        </section>

        {/* 안내문 (부드러운 면책) */}
        <section
          style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: '#F0F9FF',
            borderRadius: '8px',
            fontSize: '9pt',
            color: '#0369A1',
            lineHeight: '1.6',
          }}
        >
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>
            💡 구직 활동 시 참고자료로 활용할 수 있어요.
          </p>
          <p>
            공식 증명이 필요하면 해당 사업장에 요청해주세요.
          </p>
        </section>

        {/* 푸터 */}
        <footer
          style={{
            marginTop: '30px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
            fontSize: '8pt',
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          <p>
            발급: 사인플리즈 (SignPlease) | 전자근로계약서 플랫폼
          </p>
          <p style={{ marginTop: '4px' }}>
            signplease.vercel.app
          </p>
        </footer>
      </div>
    );
  }
);

CareerCertificatePDF.displayName = 'CareerCertificatePDF';

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

const headerCellStyle: React.CSSProperties = {
  padding: '10px 8px',
  border: '1px solid #E5E7EB',
  fontWeight: 'bold',
  fontSize: '10pt',
  textAlign: 'center',
};

const dataCellStyle: React.CSSProperties = {
  padding: '10px 8px',
  border: '1px solid #E5E7EB',
  fontSize: '10pt',
};

export default CareerCertificatePDF;
