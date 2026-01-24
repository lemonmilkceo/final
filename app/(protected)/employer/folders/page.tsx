import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import FolderManager from './folder-manager';

export default async function FoldersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 폴더 목록 조회
  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 색상 팔레트 (폴더 인덱스에 따라 할당)
  const colorPalette = [
    '#3B82F6', '#22C55E', '#EAB308', '#F97316',
    '#EF4444', '#A855F7', '#EC4899', '#6B7280',
  ];

  // 각 폴더별 계약서 수 조회
  const foldersWithCount = await Promise.all(
    (folders || []).map(async (folder, index) => {
      const { count } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('folder_id', folder.id)
        .neq('status', 'deleted');

      return {
        id: folder.id,
        name: folder.name,
        color: colorPalette[index % colorPalette.length], // 인덱스 기반 색상
        created_at: folder.created_at,
        contractCount: count || 0,
      };
    })
  );

  // 미분류 계약서 수 조회
  const { count: unfiledCount } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', user.id)
    .is('folder_id', null)
    .neq('status', 'deleted');

  return (
    <FolderManager
      folders={foldersWithCount}
      unfiledCount={unfiledCount || 0}
    />
  );
}
