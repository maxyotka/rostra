/**
 * Rostra — a component system for admin panels and internal corporate tools.
 *
 * Styles are loaded separately, as a single file:
 *   import 'rostra-ui/rostra.css'
 * The font is optional: import 'rostra-ui/fonts.css', or use a local copy.
 */
export { cx } from './cx'
export { Rostra, LayerScope, useRostraTheme } from './theme'
export type { Theme, Density, ThemeSettings, RostraProps } from './theme'

export { Button, Field, Input, Textarea, Select, Checkbox, Radio, Switch } from './forms'
export type { ButtonProps, FieldProps } from './forms'

export {
  Eyebrow,
  Card,
  CardBody,
  Divider,
  Badge,
  Chip,
  Metric,
  Meter,
  Table,
  TableWrap,
  Num,
  EmptyState,
  Skeleton,
  Steps,
  Alert,
  Avatar,
  AvatarStack,
  Kbd,
  KeyValue,
  Timeline,
} from './data'
export type {
  EyebrowProps,
  BadgeProps,
  ChipProps,
  MetricProps,
  MeterProps,
  TableProps,
  EmptyStateProps,
  SkeletonProps,
  StepsProps,
  AlertProps,
  AvatarProps,
  KeyValueProps,
  TimelineItem,
} from './data'

export { Dialog, Drawer, DialogClose, Popover, Tooltip, Menu, Toast, ToastViewport, useToasts } from './layers'
export type { PopoverProps, TooltipProps, MenuItem, MenuProps, ToastProps, ToastRecord } from './layers'

export {
  AppShell,
  AppMain,
  AppBar,
  Pane,
  Sidebar,
  Topbar,
  NavItem,
  Rail,
  RailItem,
  Breadcrumbs,
  Tabs,
  Segmented,
  SystemState,
} from './shell'
export type {
  PaneProps,
  SidebarProps,
  NavItemProps,
  RailItemProps,
  BreadcrumbsProps,
  TabsProps,
  SegmentedProps,
  SystemStateProps,
} from './shell'
