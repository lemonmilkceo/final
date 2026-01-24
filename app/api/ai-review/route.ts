import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트는 API 키가 있을 때만 생성
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// 최저시급 (2026년 기준 예상치)
const MINIMUM_WAGE = 10030;

interface ContractData {
  hourly_wage: number;
  includes_weekly_allowance: boolean;
  work_days_per_week: number | null;
  work_days: string[] | null;
  work_start_time: string;
  work_end_time: string;
  break_minutes: number;
  work_location: string;
  job_description: string;
  pay_day: number;
  start_date: string;
  end_date: string | null;
  business_size: string;
}

interface ReviewItem {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  suggestion: string | null;
}

interface ReviewResult {
  overall_status: 'pass' | 'warning' | 'fail';
  items: ReviewItem[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: '계약서 ID가 필요해요' },
        { status: 400 }
      );
    }

    // 계약서 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('employer_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: '계약서를 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // 기존 AI 리뷰 확인
    const { data: existingReview } = await supabase
      .from('ai_reviews')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingReview) {
      // 이미 리뷰가 있으면 기존 결과 반환
      const cachedResult = existingReview.result as unknown as ReviewResult;
      return NextResponse.json({
        success: true,
        review: {
          overall_status: cachedResult.overall_status,
          review_items: cachedResult.items,
        },
        cached: true,
      });
    }

    // AI 크레딧 확인 및 차감
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'use_credit',
      {
        p_user_id: user.id,
        p_credit_type: 'ai_review',
        p_amount: 1,
        p_description: 'AI 노무사 검토',
        p_reference_id: contractId,
      }
    );

    if (creditError || !creditResult) {
      return NextResponse.json(
        { error: 'AI 검토 크레딧이 부족해요' },
        { status: 402 }
      );
    }

    // 기본 검토 로직 (규칙 기반)
    const basicReview = performBasicReview(contract as ContractData);

    // OpenAI API 호출 (선택적)
    let aiSuggestions: string | null = null;
    const openaiClient = getOpenAIClient();
    if (openaiClient) {
      try {
        aiSuggestions = await getAISuggestions(openaiClient, contract as ContractData);
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        // AI 호출 실패해도 기본 검토 결과는 반환
      }
    }

    // 결과 저장
    const reviewResult: ReviewResult = {
      overall_status: basicReview.overall_status,
      items: basicReview.items.map((item) => ({
        ...item,
        suggestion: item.suggestion || (aiSuggestions ? extractSuggestion(aiSuggestions, item.category) : null),
      })),
    };

    const { error: saveError } = await supabase
      .from('ai_reviews')
      .insert({
        contract_id: contractId,
        requested_by: user.id,
        result: JSON.parse(JSON.stringify(reviewResult)),
      });

    if (saveError) {
      console.error('Review save error:', saveError);
    }

    return NextResponse.json({
      success: true,
      review: {
        overall_status: reviewResult.overall_status,
        review_items: reviewResult.items,
      },
      cached: false,
    });
  } catch (error) {
    console.error('AI Review error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}

function performBasicReview(contract: ContractData): ReviewResult {
  const items: ReviewItem[] = [];
  let hasWarning = false;
  let hasFail = false;

  // 1. 최저시급 검토
  const effectiveWage = contract.includes_weekly_allowance
    ? contract.hourly_wage
    : contract.hourly_wage;

  if (effectiveWage < MINIMUM_WAGE) {
    items.push({
      category: 'minimum_wage',
      status: 'fail',
      title: '최저시급 미달',
      description: `현재 시급 ${effectiveWage.toLocaleString()}원은 2026년 최저시급 ${MINIMUM_WAGE.toLocaleString()}원보다 낮아요.`,
      suggestion: `시급을 ${MINIMUM_WAGE.toLocaleString()}원 이상으로 조정하세요.`,
    });
    hasFail = true;
  } else {
    items.push({
      category: 'minimum_wage',
      status: 'pass',
      title: '최저시급 충족',
      description: `시급 ${effectiveWage.toLocaleString()}원은 최저시급을 충족해요.`,
      suggestion: null,
    });
  }

  // 2. 휴게시간 검토
  const workDays = contract.work_days?.length || contract.work_days_per_week || 0;
  const [startHour, startMin] = contract.work_start_time.split(':').map(Number);
  const [endHour, endMin] = contract.work_end_time.split(':').map(Number);
  
  let workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (workMinutes < 0) workMinutes += 24 * 60; // 야간 근무
  
  const workHours = workMinutes / 60;
  const requiredBreak = workHours >= 8 ? 60 : workHours >= 4 ? 30 : 0;

  if (contract.break_minutes < requiredBreak) {
    items.push({
      category: 'break_time',
      status: 'warning',
      title: '휴게시간 부족 가능',
      description: `${workHours.toFixed(1)}시간 근무 시 법정 휴게시간은 ${requiredBreak}분이에요. 현재 ${contract.break_minutes}분으로 설정되어 있어요.`,
      suggestion: `휴게시간을 ${requiredBreak}분 이상으로 조정하세요.`,
    });
    hasWarning = true;
  } else {
    items.push({
      category: 'break_time',
      status: 'pass',
      title: '휴게시간 적정',
      description: `휴게시간 ${contract.break_minutes}분은 법정 기준을 충족해요.`,
      suggestion: null,
    });
  }

  // 3. 주휴수당 검토
  if (workDays >= 5 && !contract.includes_weekly_allowance) {
    items.push({
      category: 'weekly_allowance',
      status: 'warning',
      title: '주휴수당 미포함',
      description: `주 ${workDays}일 근무 시 주휴수당이 발생할 수 있어요. 현재 시급에 포함되어 있지 않아요.`,
      suggestion: '주휴수당 포함 여부를 확인하거나, 별도 지급 계획을 세우세요.',
    });
    hasWarning = true;
  } else if (contract.includes_weekly_allowance) {
    items.push({
      category: 'weekly_allowance',
      status: 'pass',
      title: '주휴수당 포함',
      description: '시급에 주휴수당이 포함되어 있어요.',
      suggestion: null,
    });
  } else {
    items.push({
      category: 'weekly_allowance',
      status: 'pass',
      title: '주휴수당 해당 없음',
      description: `주 ${workDays}일 근무로 주휴수당 의무 대상이 아니에요.`,
      suggestion: null,
    });
  }

  // 4. 필수 항목 검토
  const missingFields: string[] = [];
  if (!contract.work_location) missingFields.push('근무장소');
  if (!contract.job_description) missingFields.push('업무내용');
  if (!contract.start_date) missingFields.push('계약시작일');

  if (missingFields.length > 0) {
    items.push({
      category: 'required_fields',
      status: 'warning',
      title: '필수 항목 누락',
      description: `다음 항목이 비어있어요: ${missingFields.join(', ')}`,
      suggestion: '누락된 항목을 입력하세요.',
    });
    hasWarning = true;
  } else {
    items.push({
      category: 'required_fields',
      status: 'pass',
      title: '필수 항목 충족',
      description: '모든 필수 항목이 입력되어 있어요.',
      suggestion: null,
    });
  }

  // 전체 상태 결정
  let overall_status: 'pass' | 'warning' | 'fail' = 'pass';
  if (hasFail) overall_status = 'fail';
  else if (hasWarning) overall_status = 'warning';

  return { overall_status, items };
}

async function getAISuggestions(openai: OpenAI, contract: ContractData): Promise<string> {
  const prompt = `
당신은 한국 노동법 전문 노무사입니다. 다음 근로계약서 내용을 검토하고 개선 제안을 해주세요.

계약서 정보:
- 시급: ${contract.hourly_wage.toLocaleString()}원
- 주휴수당 포함 여부: ${contract.includes_weekly_allowance ? '포함' : '미포함'}
- 근무일: ${contract.work_days?.join(', ') || `주 ${contract.work_days_per_week}일`}
- 근무시간: ${contract.work_start_time} ~ ${contract.work_end_time}
- 휴게시간: ${contract.break_minutes}분
- 근무장소: ${contract.work_location}
- 업무내용: ${contract.job_description}
- 급여일: 매월 ${contract.pay_day}일
- 계약기간: ${contract.start_date} ~ ${contract.end_date || '기간 정함 없음'}
- 사업장 규모: ${contract.business_size === 'under_5' ? '5인 미만' : '5인 이상'}

간결하고 실용적인 조언을 3-4줄로 제공해주세요.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

function extractSuggestion(aiResponse: string, _category: string): string | null {
  // AI 응답에서 카테고리별 제안 추출 (간단한 구현)
  // 실제로는 더 정교한 파싱이 필요할 수 있음
  return aiResponse.length > 0 ? aiResponse : null;
}
