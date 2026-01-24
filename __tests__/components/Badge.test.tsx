import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import Badge from '@/components/ui/Badge';

describe('Badge 컴포넌트', () => {
  it('기본 Badge가 렌더링되어야 한다', () => {
    render(<Badge variant="waiting">테스트</Badge>);
    expect(screen.getByText('테스트')).toBeInTheDocument();
  });

  it('waiting variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="waiting">대기중</Badge>);
    expect(screen.getByText('대기중')).toHaveClass('bg-amber-100');
    expect(screen.getByText('대기중')).toHaveClass('text-amber-600');
  });

  it('pending variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="pending">대기중</Badge>);
    expect(screen.getByText('대기중')).toHaveClass('bg-amber-100');
    expect(screen.getByText('대기중')).toHaveClass('text-amber-600');
  });

  it('complete variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="complete">완료</Badge>);
    expect(screen.getByText('완료')).toHaveClass('bg-green-100');
    expect(screen.getByText('완료')).toHaveClass('text-green-600');
  });

  it('completed variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="completed">완료</Badge>);
    expect(screen.getByText('완료')).toHaveClass('bg-green-100');
    expect(screen.getByText('완료')).toHaveClass('text-green-600');
  });

  it('expired variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="expired">만료</Badge>);
    expect(screen.getByText('만료')).toHaveClass('bg-gray-100');
    expect(screen.getByText('만료')).toHaveClass('text-gray-500');
  });

  it('urgent variant가 올바른 스타일을 가져야 한다', () => {
    render(<Badge variant="urgent">긴급</Badge>);
    expect(screen.getByText('긴급')).toHaveClass('bg-red-100');
    expect(screen.getByText('긴급')).toHaveClass('text-red-600');
  });

  it('추가 className이 적용되어야 한다', () => {
    render(<Badge variant="waiting" className="custom-class">테스트</Badge>);
    expect(screen.getByText('테스트')).toHaveClass('custom-class');
  });
});
