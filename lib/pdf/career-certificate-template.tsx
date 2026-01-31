import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Noto Sans KR - TTF 형식)
// @react-pdf/renderer는 TTF/OTF 형식만 안정적으로 지원
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://rawcdn.githack.com/nicePaul521/noto-sans-kr-webfont/b7e27afa8e7d4c1438c9ec3f7ab09f9a8e9f4aa4/fonts/NotoSansKR-Regular.otf',
      fontWeight: 'normal',
    },
    {
      src: 'https://rawcdn.githack.com/nicePaul521/noto-sans-kr-webfont/b7e27afa8e7d4c1438c9ec3f7ab09f9a8e9f4aa4/fonts/NotoSansKR-Bold.otf',
      fontWeight: 'bold',
    },
  ],
});

// 하이픈 처리 비활성화 (한글 지원)
Font.registerHyphenationCallback((word) => [word]);

const fontFamily = 'NotoSansKR';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: fontFamily,
    fontSize: 10,
    lineHeight: 1.6,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderLeft: '3px solid #3b82f6',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e5e5',
    paddingVertical: 8,
  },
  label: {
    width: '25%',
    color: '#666',
    fontSize: 10,
  },
  value: {
    width: '75%',
    fontWeight: 'bold',
    fontSize: 10,
  },
  // 경력 테이블 스타일
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #333',
    borderBottom: '1px solid #333',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e5e5',
    paddingVertical: 8,
    minHeight: 35,
  },
  tableRowLast: {
    flexDirection: 'row',
    borderBottom: '1px solid #333',
    paddingVertical: 8,
    minHeight: 35,
  },
  colNo: {
    width: '8%',
    textAlign: 'center',
    fontSize: 9,
  },
  colWorkplace: {
    width: '25%',
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colJob: {
    width: '20%',
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colPeriod: {
    width: '32%',
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colDuration: {
    width: '15%',
    textAlign: 'center',
    fontSize: 9,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  // 총 경력 요약
  summaryBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  // 증명 문구
  certificationText: {
    marginTop: 40,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 2,
  },
  // 발급 정보
  issueSection: {
    marginTop: 50,
    alignItems: 'center',
  },
  issueDate: {
    fontSize: 12,
    marginBottom: 30,
  },
  issuer: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  issuerSub: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  // 푸터
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1px solid #e5e5e5',
    paddingTop: 10,
  },
  // 안내문
  notice: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#fefce8',
    fontSize: 8,
    color: '#854d0e',
    lineHeight: 1.5,
  },
});

export interface CareerItem {
  id: string;
  workplaceName: string;
  jobDescription: string;
  startDate: string;
  endDate: string | null;
  durationDays: number;
}

export interface CareerCertificatePDFProps {
  worker: {
    name: string;
    birthDate?: string; // 주민번호 앞 6자리에서 추출한 생년월일
  };
  careers: CareerItem[];
  totalDays: number;
  totalContracts: number;
  issueDate: string;
}

export function CareerCertificatePDFDocument({
  worker,
  careers,
  totalDays,
  totalContracts,
  issueDate,
}: CareerCertificatePDFProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatPeriod = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const startStr = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')}`;
    
    if (!endDate) {
      return `${startStr} ~ 현재`;
    }
    
    const end = new Date(endDate);
    const endStr = `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`;
    return `${startStr} ~ ${endStr}`;
  };

  const formatDuration = (days: number) => {
    if (days < 30) {
      return `${days}일`;
    }
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months}개월`;
    }
    return `${months}개월 ${remainingDays}일`;
  };

  const formatTotalDuration = (days: number) => {
    if (days < 30) {
      return `${days}일`;
    }
    const years = Math.floor(days / 365);
    const remainingAfterYears = days % 365;
    const months = Math.floor(remainingAfterYears / 30);
    const remainingDays = remainingAfterYears % 30;

    let result = '';
    if (years > 0) result += `${years}년 `;
    if (months > 0) result += `${months}개월 `;
    if (remainingDays > 0 && years === 0) result += `${remainingDays}일`;
    return result.trim() || '0일';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 제목 */}
        <Text style={styles.title}>경 력 증 명 서</Text>
        <Text style={styles.subtitle}>Certificate of Employment</Text>

        {/* 1. 인적사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 인적사항</Text>
          <View style={styles.row}>
            <Text style={styles.label}>성명</Text>
            <Text style={styles.value}>{worker.name}</Text>
          </View>
          {worker.birthDate && (
            <View style={styles.row}>
              <Text style={styles.label}>생년월일</Text>
              <Text style={styles.value}>{worker.birthDate}</Text>
            </View>
          )}
        </View>

        {/* 2. 경력사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 경력사항</Text>
          
          {/* 테이블 헤더 */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colNo, styles.headerText]}>No.</Text>
              <Text style={[styles.colWorkplace, styles.headerText]}>근무처</Text>
              <Text style={[styles.colJob, styles.headerText]}>직종/업무</Text>
              <Text style={[styles.colPeriod, styles.headerText]}>근무기간</Text>
              <Text style={[styles.colDuration, styles.headerText]}>기간</Text>
            </View>

            {/* 테이블 데이터 */}
            {careers.map((career, index) => (
              <View 
                key={career.id} 
                style={index === careers.length - 1 ? styles.tableRowLast : styles.tableRow}
              >
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colWorkplace}>{career.workplaceName}</Text>
                <Text style={styles.colJob}>{career.jobDescription}</Text>
                <Text style={styles.colPeriod}>
                  {formatPeriod(career.startDate, career.endDate)}
                </Text>
                <Text style={styles.colDuration}>
                  {formatDuration(career.durationDays)}
                </Text>
              </View>
            ))}
          </View>

          {/* 총 경력 요약 */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 근무 기간</Text>
              <Text style={styles.summaryValue}>{formatTotalDuration(totalDays)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 계약 건수</Text>
              <Text style={styles.summaryValue}>{totalContracts}건</Text>
            </View>
          </View>
        </View>

        {/* 증명 문구 */}
        <Text style={styles.certificationText}>
          위 사실을 증명합니다.
        </Text>

        {/* 발급 정보 */}
        <View style={styles.issueSection}>
          <Text style={styles.issueDate}>{formatDate(issueDate)}</Text>
          <Text style={styles.issuer}>싸인해주세요 (SignPlease)</Text>
          <Text style={styles.issuerSub}>전자근로계약서 플랫폼</Text>
        </View>

        {/* 안내문 */}
        <View style={styles.notice}>
          <Text>
            * 본 경력증명서는 싸인해주세요 서비스를 통해 체결된 전자근로계약서를 기반으로 발급되었습니다.
          </Text>
          <Text>
            * 각 경력의 상세 내용은 개별 근로계약서를 통해 확인할 수 있습니다.
          </Text>
        </View>

        {/* 푸터 */}
        <Text style={styles.footer}>
          본 문서는 싸인해주세요 서비스를 통해 자동 발급되었습니다. | 발급번호: {Date.now().toString(36).toUpperCase()}
        </Text>
      </Page>
    </Document>
  );
}
