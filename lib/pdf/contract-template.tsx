import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Noto Sans KR) - Google Fonts 공식 URL 사용
try {
  Font.register({
    family: 'NotoSansKR',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/notosanskr/v36/Pby6FmXiEBPT4ITbgNA5CgmOelz5.woff2',
        fontWeight: 'normal',
      },
      {
        src: 'https://fonts.gstatic.com/s/notosanskr/v36/Pby7FmXiEBPT4ITbgNA5Cgms1lH6.woff2',
        fontWeight: 'bold',
      },
    ],
  });
} catch (error) {
  console.error('Font registration failed:', error);
}

// 폰트 로딩 실패 시 하이픈 처리 비활성화
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansKR',
    fontSize: 10,
    lineHeight: 1.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e5e5',
    paddingVertical: 6,
  },
  label: {
    width: '30%',
    color: '#666',
  },
  value: {
    width: '70%',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: '1px solid #333',
    paddingTop: 10,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  signatureStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notice: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 8,
    color: '#666',
    lineHeight: 1.4,
  },
});

interface ContractPDFProps {
  contract: {
    workerName: string;
    wageType?: string;
    hourlyWage: number | null;
    monthlyWage?: number | null;
    includesWeeklyAllowance: boolean;
    startDate: string;
    endDate: string | null;
    workDays: string[] | null;
    workDaysPerWeek: number | null;
    workStartTime: string;
    workEndTime: string;
    breakMinutes: number;
    workLocation: string;
    jobDescription: string;
    payDay: number;
    paymentTiming?: string;
    isLastDayPayment?: boolean;
    businessSize: string;
    createdAt: string;
  };
  employer: {
    name: string;
    phone: string;
  };
  signatures: {
    signer_role: string;
    signed_at: string | null;
    signature_data: string;
  }[];
}

export function ContractPDFDocument({
  contract,
  employer,
  signatures,
}: ContractPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatWorkDays = () => {
    if (contract.workDays && contract.workDays.length > 0) {
      return contract.workDays.join(', ');
    }
    if (contract.workDaysPerWeek) {
      return `주 ${contract.workDaysPerWeek}일`;
    }
    return '-';
  };

  // 급여 정보 포맷팅
  const formatWage = () => {
    if (contract.wageType === 'monthly' && contract.monthlyWage) {
      return `월 ${formatCurrency(contract.monthlyWage)}`;
    }
    if (contract.hourlyWage) {
      return `시급 ${formatCurrency(contract.hourlyWage)}${contract.includesWeeklyAllowance ? ' (주휴수당 포함)' : ''}`;
    }
    return '-';
  };

  // 급여일 포맷팅
  const formatPayDay = () => {
    const timing = contract.paymentTiming === 'next_month' ? '익월' : '당월';
    const day = contract.isLastDayPayment ? '말일' : `${contract.payDay}일`;
    return `${timing} ${day}`;
  };

  const employerSignature = signatures.find((s) => s.signer_role === 'employer');
  const workerSignature = signatures.find((s) => s.signer_role === 'worker');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 제목 */}
        <Text style={styles.title}>표준근로계약서</Text>

        {/* 근로자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 근로자 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>성명</Text>
            <Text style={styles.value}>{contract.workerName}</Text>
          </View>
        </View>

        {/* 근로 조건 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 근로 조건</Text>
          <View style={styles.row}>
            <Text style={styles.label}>급여</Text>
            <Text style={styles.value}>{formatWage()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>근무 기간</Text>
            <Text style={styles.value}>
              {formatDate(contract.startDate)} ~{' '}
              {contract.endDate ? formatDate(contract.endDate) : '기간 정함 없음'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>근무 요일</Text>
            <Text style={styles.value}>{formatWorkDays()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>근무 시간</Text>
            <Text style={styles.value}>
              {contract.workStartTime} ~ {contract.workEndTime}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>휴게 시간</Text>
            <Text style={styles.value}>{contract.breakMinutes}분</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>근무 장소</Text>
            <Text style={styles.value}>{contract.workLocation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>업무 내용</Text>
            <Text style={styles.value}>{contract.jobDescription}</Text>
          </View>
        </View>

        {/* 급여 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 급여 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>급여일</Text>
            <Text style={styles.value}>{formatPayDay()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>사업장 규모</Text>
            <Text style={styles.value}>
              {contract.businessSize === 'under_5' ? '5인 미만' : '5인 이상'}
            </Text>
          </View>
        </View>

        {/* 사업자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 사업자 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>사업주</Text>
            <Text style={styles.value}>{employer.name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>연락처</Text>
            <Text style={styles.value}>{employer.phone || '-'}</Text>
          </View>
        </View>

        {/* 서명 영역 */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>사업주</Text>
            <Text style={styles.signatureStatus}>
              {employerSignature?.signed_at
                ? `✓ 서명완료 (${formatDate(employerSignature.signed_at)})`
                : '서명 대기 중'}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>근로자</Text>
            <Text style={styles.signatureStatus}>
              {workerSignature?.signed_at
                ? `✓ 서명완료 (${formatDate(workerSignature.signed_at)})`
                : '서명 대기 중'}
            </Text>
          </View>
        </View>

        {/* 안내문 */}
        <View style={styles.notice}>
          <Text>
            본 계약서는 근로기준법에 따라 작성되었으며, 양 당사자가 서명함으로써 효력이
            발생합니다. 계약서 작성일: {formatDate(contract.createdAt)}
          </Text>
        </View>

        {/* 푸터 */}
        <Text style={styles.footer}>
          본 문서는 싸인해주세요 서비스를 통해 작성되었습니다.
        </Text>
      </Page>
    </Document>
  );
}
