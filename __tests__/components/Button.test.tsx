import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { Button } from '@/components/ui/Button';

describe('Button 컴포넌트', () => {
  it('기본 버튼이 렌더링되어야 한다', () => {
    render(<Button>클릭</Button>);
    expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument();
  });

  it('클릭 이벤트가 동작해야 한다', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>클릭</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서 클릭이 안 되어야 한다', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        클릭
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading 상태에서 버튼이 disabled 되어야 한다', () => {
    render(<Button loading>클릭</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('variant에 따라 스타일이 달라야 한다', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-ghost');

    rerender(<Button variant="kakao">Kakao</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-kakao');
  });

  it('fullWidth가 true면 w-full 클래스가 있어야 한다', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('fullWidth가 false면 w-auto 클래스가 있어야 한다', () => {
    render(<Button fullWidth={false}>Auto Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-auto');
  });
});
