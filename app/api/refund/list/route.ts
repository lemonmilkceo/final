import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * 내 환불 요청 목록 조회 API
 * GET /api/refund/list
 */
export async function GET() {
  try {
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

    // 환불 요청 목록 조회
    const { data: refundRequests, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Refund list error:', error);
      return NextResponse.json(
        { error: '환불 내역을 불러오는 데 실패했어요' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refundRequests: refundRequests || [],
    });
  } catch (error) {
    console.error('Refund list error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
