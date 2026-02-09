import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 환불 요청 취소 API
 * POST /api/refund/cancel/[id]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요해요' },
        { status: 401 }
      );
    }

    // 환불 요청 조회
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !refundRequest) {
      return NextResponse.json(
        { error: '환불 요청을 찾을 수 없어요' },
        { status: 404 }
      );
    }

    // pending 상태만 취소 가능
    if (refundRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 요청은 취소할 수 없어요' },
        { status: 400 }
      );
    }

    // 상태 업데이트
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Refund cancel error:', updateError);
      return NextResponse.json(
        { error: '취소에 실패했어요' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refund cancel error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
