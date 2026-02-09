'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 문의 카테고리 타입
export type InquiryCategory = 'contract' | 'payment' | 'account' | 'etc';

// 문의 생성
export async function createInquiry(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const category = formData.get('category') as string;
  const subject = formData.get('subject') as string;
  const content = formData.get('content') as string;

  if (!category || !subject || !content) {
    return { success: false, error: '모든 필드를 입력해주세요.' };
  }

  if (subject.length < 2) {
    return { success: false, error: '제목은 2자 이상 입력해주세요.' };
  }

  if (content.length < 10) {
    return { success: false, error: '내용은 10자 이상 입력해주세요.' };
  }

  const { data, error } = await supabase
    .from('cs_inquiries')
    .insert({
      user_id: user.id,
      category,
      subject,
      content,
      status: 'pending',
      priority: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('문의 생성 오류:', error);
    return { success: false, error: '문의 등록에 실패했습니다.' };
  }

  revalidatePath('/support/inquiry');
  return { success: true, inquiryId: data.id };
}

// 내 문의 목록 조회
export async function getMyInquiries() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.', inquiries: [] };
  }

  const { data, error } = await supabase
    .from('cs_inquiries')
    .select(`
      id,
      category,
      subject,
      status,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('문의 목록 조회 오류:', error);
    return { success: false, error: '문의 목록을 불러오지 못했습니다.', inquiries: [] };
  }

  return { success: true, inquiries: data || [] };
}

// 문의 상세 조회 (답변 포함)
export async function getInquiryDetail(inquiryId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.', inquiry: null, responses: [] };
  }

  // 문의 조회 (본인 것만)
  const { data: inquiry, error: inquiryError } = await supabase
    .from('cs_inquiries')
    .select('*')
    .eq('id', inquiryId)
    .eq('user_id', user.id)
    .single();

  if (inquiryError || !inquiry) {
    return { success: false, error: '문의를 찾을 수 없습니다.', inquiry: null, responses: [] };
  }

  // 답변 조회
  const { data: responses, error: responsesError } = await supabase
    .from('cs_responses')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true });

  if (responsesError) {
    console.error('답변 조회 오류:', responsesError);
  }

  return { 
    success: true, 
    inquiry, 
    responses: responses || [] 
  };
}

// 고객 추가 답변 작성
export async function addUserResponse(inquiryId: string, content: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  if (!content || content.trim().length < 2) {
    return { success: false, error: '내용을 2자 이상 입력해주세요.' };
  }

  // 해당 문의가 본인 것인지 확인
  const { data: inquiry, error: inquiryError } = await supabase
    .from('cs_inquiries')
    .select('id, status')
    .eq('id', inquiryId)
    .eq('user_id', user.id)
    .single();

  if (inquiryError || !inquiry) {
    return { success: false, error: '문의를 찾을 수 없습니다.' };
  }

  if (inquiry.status === 'closed') {
    return { success: false, error: '종료된 문의에는 답변을 추가할 수 없습니다.' };
  }

  // 답변 추가
  const { error: responseError } = await supabase
    .from('cs_responses')
    .insert({
      inquiry_id: inquiryId,
      content: content.trim(),
      responder_type: 'user',
    });

  if (responseError) {
    console.error('답변 추가 오류:', responseError);
    return { success: false, error: '답변 등록에 실패했습니다.' };
  }

  // 문의 상태를 pending으로 변경 (관리자가 확인해야 함)
  await supabase
    .from('cs_inquiries')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', inquiryId);

  revalidatePath(`/support/inquiry/${inquiryId}`);
  return { success: true };
}
