import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import {
  AppBar,
  AppMain,
  AppShell,
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Meter,
  NavItem,
  Num,
  Pane,
  Rostra,
  Select,
  Sidebar,
  SystemState,
  Table,
  TableWrap,
  Tabs,
  Topbar,
} from '../src'

/**
 * Контраст axe в jsdom посчитать не может — вычисленных цветов нет.
 * За него отвечает check-contrast.mjs на реальных значениях токенов,
 * здесь проверяется структура: роли, имена, связи, порядок заголовков.
 */
async function violations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} шт. — ${v.help}`)
}

function Screen() {
  return (
    <Rostra>
      <AppShell>
        <Sidebar aria-label="Разделы">
          <NavItem href="#clients" active>
            Клиенты
          </NavItem>
          <NavItem href="#dispatch">Диспетчерская</NavItem>
        </Sidebar>
        <AppMain>
          <AppBar>
            <Topbar>
              <Breadcrumbs items={[{ label: 'Клиенты', href: '#clients' }, { label: 'ОРГ-4182' }]} />
            </Topbar>
          </AppBar>
          <Pane>
            <h1 className="rs-title">ОРГ-4182</h1>

            <Field label="Название" hint="Как в договоре">
              {(props) => <Input {...props} placeholder="ООО «Ромашка»" />}
            </Field>
            <Field label="Тариф" error="Выберите тариф">
              {(props) => (
                <Select {...props}>
                  <option value="">Не выбран</option>
                  <option value="base">Базовый</option>
                </Select>
              )}
            </Field>
            <Checkbox name="sla">Следить за SLA</Checkbox>
            <Meter value={72} label="Использовано мест" />

            <Tabs
              items={[
                { value: 'a', label: 'Заявки', content: <p className="rs-text">Список заявок</p> },
                { value: 'b', label: 'История', content: <p className="rs-text">Лента событий</p> },
              ]}
            />

            <TableWrap>
              <Table zebra>
                <caption className="rs-sr">Заявки клиента</caption>
                <thead>
                  <tr>
                    <th scope="col">Заявка</th>
                    <th scope="col">Статус</th>
                    <th scope="col">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ДГ-2026-114</td>
                    <td>
                      <Badge status="ok">В работе</Badge>
                    </td>
                    <Num>12 400</Num>
                  </tr>
                </tbody>
              </Table>
            </TableWrap>

            <Button variant="ghost" icon aria-label="Настройки колонок">
              ⚙
            </Button>
          </Pane>
        </AppMain>
      </AppShell>
    </Rostra>
  )
}

describe('доступность', () => {
  // Зелёный axe ничего не стоит, если он на самом деле не отработал:
  // этот тест падает, когда проверка молча возвращает пустой результат.
  it('axe действительно проверяет разметку', async () => {
    const { container } = render(
      <Rostra>
        <button className="rs-btn rs-btn--icon" />
      </Rostra>
    )
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.passes.length).toBeGreaterThan(0)
    expect(results.violations.map((v) => v.id)).toContain('button-name')
  })

  it('составной экран не даёт нарушений axe', async () => {
    const { container } = render(<Screen />)
    expect(await violations(container)).toEqual([])
  })

  it('открытый диалог не даёт нарушений axe', async () => {
    render(
      <Rostra>
        <Dialog
          open
          title="Удалить клиента"
          description="Действие нельзя отменить."
          footer={<Button variant="danger">Удалить</Button>}
        >
          <Field label="Причина">{(props) => <Input {...props} />}</Field>
        </Dialog>
      </Rostra>
    )
    const dialog = screen.getByRole('dialog')
    expect(await violations(dialog)).toEqual([])
  })

  it('системное состояние не даёт нарушений axe', async () => {
    const { container } = render(
      <Rostra>
        <SystemState
          code="403"
          tone="bad"
          title="Нет доступа к разделу"
          text="Раздел закрыт ролью «Оператор»."
          actions={<Button>Запросить доступ</Button>}
          tech="запрос 8f21c4 · 12:04 · узел msk-2"
        />
      </Rostra>
    )
    expect(await violations(container)).toEqual([])
  })

  it('меню и вкладки проходят axe в открытом состоянии', async () => {
    const { container } = render(
      <Rostra>
        <Tabs
          items={[
            { value: 'a', label: 'Заявки', content: <p className="rs-text">Список</p> },
            { value: 'b', label: 'История', content: <p className="rs-text">Лента</p> },
          ]}
        />
      </Rostra>
    )
    await userEvent.click(screen.getByRole('tab', { name: 'История' }))
    expect(await violations(container)).toEqual([])
  })
})
