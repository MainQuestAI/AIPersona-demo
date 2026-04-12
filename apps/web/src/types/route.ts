import type { LucideIcon } from 'lucide-react';
import {
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  ScanSearch,
  UsersRound,
} from 'lucide-react';

export type AppRouteKey =
  | 'dashboard'
  | 'studies'
  | 'consumer-twins'
  | 'stimulus-library';

export type AppRoutePath =
  | '/dashboard'
  | '/studies'
  | '/consumer-twins'
  | '/stimulus-library';

export type AppRouteDefinition = {
  key: AppRouteKey;
  path: AppRoutePath;
  label: string;
  railLabel: string;
  tag: string;
  description: string;
  icon: LucideIcon;
};

export type StudyDetailViewKey = 'workbench' | 'compare' | 'twins';

export type StudyDetailViewDefinition = {
  key: StudyDetailViewKey;
  label: string;
  description: string;
};

export const APP_ROUTES: AppRouteDefinition[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    label: '业务总览',
    railLabel: '总览',
    tag: '总览',
    description: '查看研究项目、资产底座与运行状态的全局概览。',
    icon: LayoutDashboard,
  },
  {
    key: 'studies',
    path: '/studies',
    label: '研究项目',
    railLabel: '研究',
    tag: '主线',
    description: '创建、浏览并进入 Study Detail 的正式入口。',
    icon: ScanSearch,
  },
  {
    key: 'consumer-twins',
    path: '/consumer-twins',
    label: '孪生中心',
    railLabel: '孪生',
    tag: '资产',
    description: '查看 Twin 资产、版本与来源链，作为后续研究执行的稳定底座。',
    icon: UsersRound,
  },
  {
    key: 'stimulus-library',
    path: '/stimulus-library',
    label: '刺激物库',
    railLabel: '刺激物',
    tag: '资产',
    description: '导入、查看并管理可进入研究执行的刺激物资产。',
    icon: LibraryBig,
  },
];

export const STUDY_DETAIL_VIEWS: StudyDetailViewDefinition[] = [
  {
    key: 'workbench',
    label: '研究工作台',
    description: '计划、审批、执行与聊天主舞台。',
  },
  {
    key: 'compare',
    label: '概念对比',
    description: '解释排序、差异与最终推荐理由。',
  },
  {
    key: 'twins',
    label: '孪生溯源',
    description: '查看 Twin 与 Stimulus 的来源和版本说明。',
  },
];

export const APP_ROUTE_MAP = Object.fromEntries(
  APP_ROUTES.map((route) => [route.path, route]),
) as Record<AppRoutePath, AppRouteDefinition>;

export const STUDY_DETAIL_ICON = FlaskConical;
