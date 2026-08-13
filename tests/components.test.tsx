import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  Field,
  Input,
  Menu,
  Meter,
  Rostra,
  Segmented,
  Switch,
  Tabs,
  cx,
} from '../src'

describe('cx', () => {
  it('склеивает строки и ключи объектов, пропуская пустое', () => {
    expect(cx('a', false, undefined, { b: true, c: false }, 'd')).toBe('a b d')
  })
})

describe('Button', () => {
  it('в состоянии загрузки не вызывает onClick и помечен aria-busy', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Сохранить' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('обычная кнопка кликается и не отправляет форму по умолчанию', async () => {
    const onClick = vi.fn()
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button onClick={onClick}>Ок</Button>
      </form>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ок' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('Field', () => {
  it('связывает подпись, подсказку и ошибку с полем', () => {
    render(
      <Field label="Название" hint="Как в договоре" error="Обязательное поле" required>
        {(props) => <Input {...props} />}
      </Field>
    )
    const input = screen.getByLabelText(/Название/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeRequired()
    expect(input).toHaveAccessibleDescription('Как в договоре Обязательное поле')
    expect(screen.getByRole('alert')).toHaveTextContent('Обязательное поле')
  })
})

describe('Checkbox и Switch', () => {
  it('переключаются мышью и пробелом, оставаясь нативными полями формы', async () => {
    render(
      <>
        <Checkbox name="agree">Согласен</Checkbox>
        <Switch name="live">Живые данные</Switch>
      </>
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Согласен' })
    const toggle = screen.getByRole('switch', { name: 'Живые данные' })

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    toggle.focus()
    await userEvent.keyboard(' ')
    expect(toggle).toBeChecked()
  })
})

describe('Meter', () => {
  it('подрезает значение вне диапазона, чтобы полоса не выехала', () => {
    const { rerender } = render(<Meter value={140} label="Загрузка" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    rerender(<Meter value={-20} label="Загрузка" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('Avatar', () => {
  it('собирает инициалы и оставляет полное имя диктору', () => {
    render(<Avatar name="Пётр Иванов" />)
    expect(screen.getByText('ПИ')).toBeInTheDocument()
    expect(screen.getByText('Пётр Иванов')).toHaveClass('rs-sr')
  })
})

describe('Alert', () => {
  it('ошибка перебивает чтение, остальное ждёт паузы', () => {
    const { rerender } = render(<Alert status="bad" title="Отчёт не собрался" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<Alert status="info" title="Скоро обслуживание" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return (
    <Rostra>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Открыть</Button>}
        title="Удалить клиента"
        description="Действие нельзя отменить."
        footer={
          <DialogClose>
            <Button>Отмена</Button>
          </DialogClose>
        }
      >
        <Input aria-label="Причина" />
      </Dialog>
    </Rostra>
  )
}

describe('Dialog', () => {
  it('открывается, уводит фокус внутрь и закрывается по Esc', async () => {
    render(<DialogHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Удалить клиента')).toBeInTheDocument()
    expect(dialog).toContainElement(document.activeElement as HTMLElement | null)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('содержимое портала получает тему корня', async () => {
    render(
      <Rostra theme="dark" density="compact">
        <Dialog open title="Смена этапа" />
      </Rostra>
    )
    const scope = screen.getByRole('dialog').closest<HTMLElement>('[data-theme]')
    expect(scope).toHaveAttribute('data-theme', 'dark')
    expect(scope).toHaveAttribute('data-density', 'compact')
  })
})

describe('Tabs', () => {
  it('переключается стрелками и связывает панель с вкладкой', async () => {
    render(
      <Tabs
        items={[
          { value: 'a', label: 'Заявки', content: 'Список заявок' },
          { value: 'b', label: 'История', content: 'Лента событий' },
        ]}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Заявки' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'История' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Лента событий')
  })
})

describe('Menu', () => {
  it('открывается с клавиатуры и вызывает выбранный пункт', async () => {
    const onSelect = vi.fn()
    render(
      <Rostra>
        <Menu
          trigger={<Button>Действия</Button>}
          items={[
            { label: 'Выставить счёт', onSelect },
            { label: 'Архивировать', separated: true },
          ]}
        />
      </Rostra>
    )
    screen.getByRole('button', { name: 'Действия' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Выставить счёт' }))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})

describe('Segmented', () => {
  it('сообщает выбранный вариант и переключается', async () => {
    function Harness() {
      const [value, setValue] = useState<'compact' | 'roomy'>('compact')
      return (
        <Segmented
          label="Плотность"
          value={value}
          onChange={setValue}
          options={[
            { value: 'compact', label: 'Плотно' },
            { value: 'roomy', label: 'Просторно' },
          ]}
        />
      )
    }
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Плотно' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Просторно' }))
    expect(screen.getByRole('button', { name: 'Просторно' })).toHaveAttribute('aria-pressed', 'true')
  })
})
